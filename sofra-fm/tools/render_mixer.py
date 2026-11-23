"""Build the sound-effect, bass and melody bundles for the Sofra FM mixer."""
import base64
import json
from pathlib import Path
import subprocess
from tempfile import TemporaryDirectory
from textwrap import wrap

import numpy as np
from scipy.signal import butter, sosfilt

from render_tracks import RATE, SCORES, SITE, add_stereo, compose_score


def timebase(seconds):
    return np.arange(round(seconds * RATE)) / RATE


def noise_band(rng, samples, low, high):
    bandpass = butter(2, (low, high), fs=RATE, btype="bandpass", output="sos")
    sound = sosfilt(bandpass, rng.standard_normal(samples))
    return sound / max(.001, np.std(sound))


def grill(track, beat, rng):
    t = np.arange(len(track)) / RATE
    heat = .62 + .20 * np.cos(2 * np.pi * t / (beat * 4)) + .07 * np.sin(2 * np.pi * t / 1.17)
    for channel in range(2):
        track[:, channel] = heat * noise_band(rng, len(t), 760, 6800) * .035
    for position in rng.uniform(.04, t[-1] - .12, 260):
        pulse = timebase(float(rng.uniform(.019, .066)))
        pop = noise_band(rng, len(pulse), 1000, 9300)
        pop *= (1 - np.exp(-pulse * 1200)) * np.exp(-pulse * rng.uniform(70, 185))
        add_stereo(track, pop, position, float(rng.uniform(.016, .12)), float(rng.uniform(-.66, .66)))
    for position in np.arange(.05, t[-1], beat * 8):
        pulse = timebase(.73)
        sear = noise_band(rng, len(pulse), 380, 4800)
        sear *= np.minimum(pulse / .026, 1) * np.exp(-pulse * 3.8)
        add_stereo(track, sear, position, .12, -.10)


def coffee(track, beat, rng):
    t = np.arange(len(track)) / RATE
    foam = .62 + .29 * np.sin(2 * np.pi * t / (beat * 4) - .8)
    for channel in range(2):
        track[:, channel] = foam * noise_band(rng, len(t), 155, 1680) * .035
    for position in rng.uniform(.05, t[-1] - .12, 125):
        pulse = timebase(float(rng.uniform(.040, .105)))
        freq = rng.uniform(140, 330)
        phase = 2 * np.pi * (freq * pulse - 310 * pulse ** 2)
        bubble = (.81 * np.sin(phase) + .19 * np.sin(phase * 2.26))
        bubble += .33 * noise_band(rng, len(pulse), 185, 1700)
        bubble *= (1 - np.exp(-pulse * 720)) * np.exp(-pulse * rng.uniform(27, 71))
        add_stereo(track, bubble, position, float(rng.uniform(.03, .19)), float(rng.uniform(-.50, .50)))
    for position in np.arange(beat * 2.6, t[-1], beat * 8):
        pulse = timebase(.56)
        rising_foam = noise_band(rng, len(pulse), 260, 2850)
        rising_foam *= np.sin(np.pi * pulse / .56) ** 2
        add_stereo(track, rising_foam, position, .102, .14)


def lemonade(track, beat, rng):
    duration = len(track) / RATE
    for bar in np.arange(0, duration, beat * 8):
        for offset, level, pan in ((.07, .25, -.38), (.18, .21, .32), (.42, .18, -.11)):
            pulse = timebase(.42)
            root = rng.uniform(680, 1250)
            clink = np.sin(2 * np.pi * root * pulse) * np.exp(-pulse * 17)
            clink += .47 * np.sin(2 * np.pi * root * 2.73 * pulse) * np.exp(-pulse * 35)
            clink += .11 * noise_band(rng, len(pulse), 2000, 8300) * np.exp(-pulse * 90)
            clink *= np.minimum(pulse / .004, 1)
            add_stereo(track, clink, bar + offset, level, pan)
        pulse = timebase(2.61)
        pour = noise_band(rng, len(pulse), 270, 5700)
        splashes = .78 + .15 * np.sin(2 * np.pi * 11.2 * pulse) + .08 * np.cos(2 * np.pi * 26 * pulse)
        envelope = np.minimum(pulse / .15, 1) * np.minimum((2.61 - pulse) / .32, 1)
        add_stereo(track, pour * splashes * envelope, bar + .28, .125, .17)
        for drip in (.88, 1.32, 1.81, 2.37):
            pulse = timebase(.21)
            phase = 2 * np.pi * (460 * pulse + 770 * pulse ** 2)
            water = np.sin(phase) * np.minimum(pulse / .008, 1) * np.exp(-pulse * 28)
            add_stereo(track, water, bar + drip, .09, -.25)


EFFECTS = {
    "koz-burger": grill,
    "turk-kahvesi": coffee,
    "naneli-limonata": lemonade,
}


def level_signal(audio, rms_goal, peak_limit):
    intro, outro = round(.038 * RATE), round(.16 * RATE)
    audio[:intro] *= np.linspace(0, 1, intro)[:, None]
    audio[-outro:] *= np.linspace(1, 0, outro)[:, None]
    peak = np.max(np.abs(audio))
    rms = np.sqrt(np.mean(audio ** 2))
    return audio * min(rms_goal / rms, peak_limit / peak)


def encode_fragment(audio, path):
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-f", "f32le", "-ar", str(RATE), "-ac", "2", "-i", "pipe:0",
         "-c:a", "libmp3lame", "-b:a", "56k", str(path)],
        input=audio.astype("<f4").tobytes(), check=True,
    )
    return base64.b64encode(path.read_bytes()).decode("ascii")


def write_bundle(product, encoded, destination):
    # A classic-script bundle loads lazily over HTTP and from a local index.html.
    output = ["globalThis.sofraMixerAudio ??= {};",
              f'globalThis.sofraMixerAudio[{json.dumps(product)}] = {{']
    for layer, media in encoded.items():
        output.append(f'  "{layer}": [')
        output.extend(f'    "{line}",' for line in wrap(media, width=116))
        output.append('  ].join(""),')
    output.append("};")
    destination.write_text("\n".join(output) + "\n", encoding="ascii")


def main():
    destination = SITE / "assets" / "mixer"
    destination.mkdir(parents=True, exist_ok=True)
    score_order = {name: index for index, name in enumerate(SCORES)}
    with TemporaryDirectory(prefix="sofra-mixer-") as temp:
        for product, effect in EFFECTS.items():
            score = SCORES[product]
            _, bass, melody = compose_score(score, score_order[product], separate=True)
            kitchen = np.zeros_like(bass)
            effect(kitchen, 60 / score[0], np.random.default_rng(812 + score_order[product]))
            tracks = {
                "kitchen": level_signal(kitchen, .105, .62),
                "bass": level_signal(bass, .110, .57),
                "melody": level_signal(melody, .103, .59),
            }
            encoded = {layer: encode_fragment(audio, Path(temp) / f"{layer}.mp3")
                       for layer, audio in tracks.items()}
            write_bundle(product, encoded, destination / f"{product}.js")
    print(f"Built {len(EFFECTS)} independent three-layer mixes.")


if __name__ == "__main__":
    main()

