"""Render 12-second vertical Sofra FM adverts using each dish's photo and music."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
import json
from pathlib import Path
import subprocess
from tempfile import TemporaryDirectory

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

SITE = Path(__file__).resolve().parents[1]
WIDTH, HEIGHT = 720, 1280
FPS, SECONDS = 24, 12
PHOTO_SIZE, PHOTO_X, PHOTO_Y = 620, 50, 197
PAPER, INK, DIM, ACCENT = "#f7f4ec", "#26362b", "#545b50", "#eac777"
PLAYER_COLORS = {
    "starters": "#4b3a2e",
    "mains": "#263b30",
    "desserts": "#4c303e",
    "drinks": "#3a3850",
    "fresh": "#25473f",
}


def extract_data(path, expression):
    program = """const fs = require('node:fs');
const vm = require('node:vm');
const result = vm.runInNewContext(fs.readFileSync(process.argv[1], 'utf8') + '\\n' + process.argv[2]);
process.stdout.write(JSON.stringify(result));"""
    return json.loads(subprocess.check_output(["node", "-e", program, str(path), expression]))


def unpack_font(name, scratch):
    source = SITE / "assets" / "fonts" / f"{name}.woff"
    path = scratch / f"{name}.ttf"
    with TTFont(source) as font:
        font.flavor = None
        font.save(path)
    return path


def fit_font(draw, value, font_file, preferred, width):
    for size in range(preferred, 15, -1):
        font = ImageFont.truetype(font_file, size)
        if draw.textlength(value, font=font) <= width:
            return font
    raise ValueError(f"Story label is too long: {value}")


def format_price(value):
    return f"€{Decimal(str(value)):.2f}".replace(".", ",")


def build_poster(product, category, wave, fonts, destination):
    title, body = fonts
    image = Image.new("RGB", (WIDTH, HEIGHT), PAPER)
    draw = ImageDraw.Draw(image)
    draw.ellipse((50, 104, 91, 145), fill=INK)
    for offset in (5, 9):
        draw.ellipse((50 + offset, 104 + offset, 91 - offset, 145 - offset), outline="#78887a", width=1)
    draw.ellipse((63, 117, 78, 132), fill=ACCENT)
    draw.ellipse((69, 123, 72, 126), fill=INK)

    draw.text((104, 96), "Sofra", font=ImageFont.truetype(title, 49), fill=INK)
    draw.text((203, 109), "FM", font=ImageFont.truetype(body, 19), fill=INK)
    caption = category["name"]["tr"] + " / " + category["name"]["en"]
    draw.text((670, 124), caption, font=ImageFont.truetype(body, 23), fill=DIM, anchor="rm")
    draw.line((50, 163, 670, 163), fill="#d0c9b8", width=2)

    tr = product["name"]["tr"]
    en = product["name"]["en"]
    draw.text((50, 872), tr, font=fit_font(draw, tr, title, 66, 620), fill=INK, anchor="lm")
    if en != tr:
        draw.text((50, 925), en, font=fit_font(draw, en, body, 28, 620), fill=DIM, anchor="lm")
    draw.text((50, 990), format_price(product["price"]), font=ImageFont.truetype(body, 48), fill=INK, anchor="lm")

    panel_color = PLAYER_COLORS[product["section"]]
    draw.rounded_rectangle((50, 1048, 670, 1160), radius=12, fill=panel_color)
    draw.ellipse((70, 1071, 133, 1134), fill=ACCENT)
    draw.polygon((96, 1088, 96, 1117, 115, 1102), fill=panel_color)
    track_tr = product["track"]["tr"]
    track_en = product["track"]["en"]
    draw.text((150, 1088), track_tr, font=fit_font(draw, track_tr, body, 28, 360), fill=PAPER, anchor="lm")
    draw.text((150, 1122), track_en, font=fit_font(draw, track_en, body, 20, 360), fill="#dedbd1", anchor="lm")
    for index, amplitude in enumerate(wave[::3]):
        x = 529 + index * 7
        height = 7 + amplitude * .36
        draw.rounded_rectangle((x, 1104 - height / 2, x + 3, 1104 + height / 2), radius=1, fill=ACCENT)
    image.save(destination)


def render_story(product, category, wave, fonts, scratch, destination):
    item = product["id"]
    poster = scratch / f"{item}.png"
    build_poster(product, category, wave, fonts, poster)
    image = SITE / "assets" / "food" / f"{item}.webp"
    track = SITE / "assets" / "tracks" / f"{item}.mp3"
    frames = FPS * SECONDS
    motion = (
        f"[1:v]scale={2*PHOTO_SIZE}:{2*PHOTO_SIZE},"
        f"zoompan=z='1+0.04*on/{frames}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':"
        f"d={frames}:s={PHOTO_SIZE}x{PHOTO_SIZE}:fps={FPS}[food];"
        f"[0:v][food]overlay={PHOTO_X}:{PHOTO_Y}:shortest=1,format=yuv420p[video]"
    )
    file = destination / f"{item}.mp4"
    partial = scratch / f"{item}.mp4"
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-loop", "1", "-framerate", str(FPS), "-i", str(poster), "-i", str(image), "-i", str(track),
         "-filter_complex_threads", "1", "-filter_complex", motion, "-map", "[video]", "-map", "2:a:0",
         "-af", "afade=t=in:st=0:d=0.08,afade=t=out:st=11.45:d=0.55",
         "-t", str(SECONDS), "-r", str(FPS), "-c:v", "libx264", "-threads", "2",
         "-profile:v", "main", "-preset", "veryfast", "-crf", "27",
         "-maxrate", "440k", "-bufsize", "520k", "-c:a", "aac", "-b:a", "56k", "-movflags", "+faststart",
         str(partial)],
        check=True,
    )
    partial.replace(file)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--product", action="append", help="Render only the given product identifier. Repeat for multiple products.")
    parser.add_argument("--jobs", type=int, default=4, help="Number of simultaneous encodes.")
    args = parser.parse_args()
    catalog = extract_data(SITE / "menu-data.js", "({products, sections})")
    waveforms = extract_data(SITE / "assets" / "track-data.js", "trackData")
    categories = {category["id"]: category for category in catalog["sections"]}
    by_id = {product["id"]: product for product in catalog["products"]}
    if args.product and (invalid := set(args.product).difference(by_id)):
        parser.error("Unknown product: " + ", ".join(sorted(invalid)))
    products = [by_id[item] for item in dict.fromkeys(args.product or by_id)]
    destination = SITE / "assets" / "stories"
    destination.mkdir(parents=True, exist_ok=True)

    with TemporaryDirectory(dir=destination.parent, prefix=".stories-") as temp:
        scratch = Path(temp)
        fonts = (unpack_font("instrument-serif", scratch), unpack_font("dm-sans", scratch))

        def render(product):
            category = categories[product["section"]]
            wave = waveforms[product["id"]]["wave"]
            render_story(product, category, wave, fonts, scratch, destination)

        with ThreadPoolExecutor(max_workers=max(1, args.jobs)) as workers:
            list(workers.map(render, products))
    print(f"Rendered {len(products)} vertical story video(s).")


if __name__ == "__main__":
    main()

