"""Render the original Sofra FM instrumental clips and their waveform data."""
import argparse
import json
import math
from pathlib import Path
import subprocess

import numpy as np

SITE = Path(__file__).resolve().parents[1]
RATE = 32000
BARS = 8

# Musical voicings use MIDI roots and semitone intervals.
MAJOR = (0, 4, 7, 11)
MINOR = (0, 3, 7, 10)
DOMINANT = (0, 4, 7, 10)
SIXTH = (0, 4, 7, 9)
SUS = (0, 5, 7, 10)

# Each entry contains tempo, feel, instruments, chords, and a lead melody motif.
SCORES = {
    "burrata": (106, "bossa", "nylon", "vibes", [(53, MAJOR), (55, MINOR), (60, DOMINANT), (53, SIXTH)], (2, 4, 3, 1, 2, 4, 2, 0)),
    "mantar-bruschetta": (83, "swing", "rhodes", "nylon", [(55, MINOR), (60, MINOR), (62, DOMINANT), (55, MINOR)], (3, 1, 0, 2, 3, 4, 2, 1)),
    "humus": (89, "broken", "nylon", "pluck", [(57, MINOR), (55, SIXTH), (53, MAJOR), (52, DOMINANT)], (0, 2, 1, 3, 2, 1, 4, 3)),
    "citir-patates": (111, "funk", "rhodes", "pluck", [(57, MINOR), (57, MINOR), (55, DOMINANT), (60, MAJOR)], (1, 4, 3, 1, 2, 0, 3, 2)),
    "koz-burger": (94, "funk", "rhodes", "nylon", [(50, MINOR), (53, MAJOR), (55, MINOR), (57, DOMINANT)], (2, 1, 3, 2, 0, 2, 4, 2)),
    "mantarli-risotto": (77, "swing", "rhodes", "vibes", [(48, MAJOR), (51, MAJOR), (53, MINOR), (55, DOMINANT)], (4, 2, 1, 0, 2, 1, 3, 2)),
    "limonlu-tavuk": (108, "bossa", "nylon", "pluck", [(50, MAJOR), (52, MINOR), (57, DOMINANT), (50, SIXTH)], (2, 3, 4, 2, 1, 4, 3, 1)),
    "feslegenli-pappardelle": (101, "swing", "rhodes", "vibes", [(55, MAJOR), (52, MINOR), (57, MINOR), (62, DOMINANT)], (0, 3, 2, 1, 4, 3, 1, 2)),
    "fistikli-kruvasan": (95, "swing", "nylon", "vibes", [(48, SIXTH), (57, MINOR), (50, MINOR), (55, DOMINANT)], (2, 3, 1, 0, 1, 3, 2, 4)),
    "san-sebastian": (82, "broken", "rhodes", "nylon", [(56, MAJOR), (53, MINOR), (49, MAJOR), (51, SUS)], (4, 3, 2, 0, 1, 2, 3, 1)),
    "tiramisu": (86, "broken", "rhodes", "vibes", [(54, MINOR), (57, MAJOR), (59, MINOR), (61, DOMINANT)], (1, 3, 1, 0, 4, 2, 3, 1)),
    "cikolatali-tart": (76, "air", "pad", "rhodes", [(48, MINOR), (56, MAJOR), (51, MAJOR), (55, SUS)], (1, 2, 1, 3, 4, 3, 2, 0)),
    "flat-white": (92, "swing", "rhodes", "nylon", [(53, MAJOR), (50, MINOR), (55, MINOR), (60, DOMINANT)], (2, 1, 2, 3, 0, 4, 3, 2)),
    "buzlu-matcha": (88, "air", "pad", "vibes", [(52, MAJOR), (54, MINOR), (49, MINOR), (57, MAJOR)], (0, 2, 4, 3, 1, 2, 4, 1)),
    "vanilyali-cold-brew": (116, "house", "pluck", "rhodes", [(49, MINOR), (52, MAJOR), (57, MAJOR), (56, DOMINANT)], (0, 3, 1, 2, 4, 2, 1, 3)),
    "hibiskus-cayi": (97, "broken", "pad", "pluck", [(55, MINOR), (51, MAJOR), (53, SIXTH), (50, DOMINANT)], (2, 4, 3, 2, 0, 1, 2, 4)),
    "naneli-limonata": (114, "bossa", "nylon", "vibes", [(55, SIXTH), (57, MINOR), (60, MAJOR), (62, DOMINANT)], (4, 3, 1, 2, 4, 2, 0, 3)),
    "portakal-zencefil": (112, "funk", "pluck", "vibes", [(53, SIXTH), (55, MINOR), (57, MINOR), (60, DOMINANT)], (0, 2, 3, 4, 2, 1, 0, 2)),
    "kinoa-kasesi": (99, "bossa", "rhodes", "nylon", [(50, MAJOR), (54, MINOR), (55, MAJOR), (57, SUS)], (1, 2, 4, 2, 3, 1, 2, 0)),
    "cilekli-yogurt": (104, "air", "rhodes", "pluck", [(51, MAJOR), (48, MINOR), (56, MAJOR), (58, DOMINANT)], (3, 4, 2, 1, 3, 2, 4, 0)),
    "koz-domates-corbasi": (91, "bossa", "nylon", "pluck", [(52, MINOR), (55, MAJOR), (57, MINOR), (59, DOMINANT)], (3, 2, 1, 4, 1, 0, 2, 3)),
    "falafel": (102, "funk", "pluck", "rhodes", [(50, MINOR), (55, DOMINANT), (53, SIXTH), (57, SUS)], (1, 3, 2, 4, 2, 0, 1, 4)),
    "ispanakli-borek": (84, "swing", "nylon", "vibes", [(55, MAJOR), (52, MINOR), (57, MINOR), (62, DOMINANT)], (0, 2, 3, 4, 0, 1, 3, 2)),
    "izgara-hellim": (106, "broken", "rhodes", "nylon", [(59, MINOR), (55, MAJOR), (57, SIXTH), (54, DOMINANT)], (2, 1, 4, 4, 3, 2, 1, 0)),
    "izgara-somon": (89, "air", "pad", "vibes", [(48, MAJOR), (53, MAJOR), (57, MINOR), (55, SUS)], (4, 2, 0, 3, 1, 2, 4, 0)),
    "kofte-pilav": (96, "funk", "rhodes", "nylon", [(55, MINOR), (51, MAJOR), (53, DOMINANT), (50, DOMINANT)], (2, 3, 1, 4, 3, 1, 2, 0)),
    "margherita": (112, "bossa", "nylon", "vibes", [(55, SIXTH), (52, MINOR), (57, MINOR), (62, DOMINANT)], (2, 4, 0, 1, 4, 2, 1, 0)),
    "sebzeli-taco": (113, "broken", "pluck", "vibes", [(57, MINOR), (60, MAJOR), (53, SIXTH), (55, DOMINANT)], (0, 4, 1, 3, 4, 1, 2, 3)),
    "karamelli-brownie": (80, "swing", "rhodes", "nylon", [(54, MINOR), (59, MINOR), (52, DOMINANT), (57, MAJOR)], (2, 4, 3, 2, 0, 1, 4, 3)),
    "limonlu-tart": (105, "bossa", "nylon", "pluck", [(57, MAJOR), (59, MINOR), (52, DOMINANT), (57, SIXTH)], (3, 1, 2, 4, 0, 4, 2, 3)),
    "frambuazli-panna-cotta": (85, "air", "pad", "vibes", [(53, MAJOR), (60, SUS), (57, MINOR), (58, MAJOR)], (4, 1, 2, 3, 2, 4, 2, 0)),
    "vanilyali-dondurma": (98, "swing", "rhodes", "vibes", [(50, SIXTH), (47, MINOR), (52, MINOR), (57, DOMINANT)], (1, 3, 4, 2, 3, 1, 0, 2)),
    "turk-kahvesi": (78, "broken", "nylon", "rhodes", [(50, MINOR), (51, MAJOR), (55, MINOR), (57, DOMINANT)], (1, 2, 3, 0, 4, 3, 1, 0)),
    "sicak-cikolata": (83, "swing", "pad", "rhodes", [(48, MINOR), (53, MINOR), (55, DOMINANT), (51, SIXTH)], (2, 1, 4, 3, 1, 3, 0, 2)),
    "buzlu-karamel-latte": (105, "funk", "pluck", "rhodes", [(56, MINOR), (52, MAJOR), (54, DOMINANT), (51, SUS)], (0, 3, 2, 0, 4, 2, 3, 1)),
    "masala-cai": (90, "broken", "rhodes", "nylon", [(52, MINOR), (53, MAJOR), (57, MINOR), (59, SUS)], (1, 4, 3, 0, 2, 4, 1, 2)),
    "mango-ananas": (114, "bossa", "nylon", "pluck", [(51, SIXTH), (53, MINOR), (58, DOMINANT), (55, MINOR)], (4, 2, 3, 0, 3, 1, 4, 3)),
    "cilek-feslegen-soda": (118, "house", "pluck", "vibes", [(54, MINOR), (57, MAJOR), (52, MAJOR), (56, SUS)], (3, 0, 2, 3, 1, 0, 4, 1)),
    "karpuz-nane": (106, "air", "rhodes", "pluck", [(53, MAJOR), (57, MINOR), (58, MAJOR), (55, MINOR)], (2, 0, 4, 3, 1, 2, 4, 0)),
    "meyve-tabagi": (111, "bossa", "nylon", "vibes", [(52, SIXTH), (54, MINOR), (59, DOMINANT), (57, MAJOR)], (1, 4, 2, 3, 4, 2, 0, 1)),
}

# Beat positions in a four-beat bar.
GROOVES = {
    "bossa": {"kick": (0, 2.5), "snare": (1.5, 3), "hat": (0.5, 1, 2, 3.5), "chords": (0, 1.5, 3.25), "bass": (0, 1.75, 2.5, 3.5), "lead": (0.5, 1.75, 3)},
    "swing": {"kick": (0, 2), "snare": (1, 3), "hat": (0, 0.66, 1, 2, 2.66, 3), "chords": (0, 1.66, 3), "bass": (0, 1, 2, 3), "lead": (0.66, 1.66, 2.66)},
    "broken": {"kick": (0, 1.75, 2.5), "snare": (1, 3), "hat": (0.5, 1.5, 2.25, 3.5), "chords": (0, 2.5), "bass": (0, 1.75, 2.75), "lead": (0.25, 1.5, 3.25)},
    "funk": {"kick": (0, 1.5, 2.5, 3.75), "snare": (1, 3), "hat": (0.5, 1.5, 2.25, 2.75, 3.5), "chords": (0, 1.25, 2.5, 3.5), "bass": (0, 0.75, 2, 2.75, 3.5), "lead": (0.5, 1.75, 3.25)},
    "air": {"kick": (0, 2.5), "snare": (3,), "hat": (1.5, 3.5), "chords": (0, 2), "bass": (0, 2.5), "lead": (0.75, 2.75)},
    "house": {"kick": (0, 1, 2, 3), "snare": (1, 3), "hat": (0.5, 1.5, 2.5, 3.5), "chords": (0.5, 1.5, 2.5, 3.5), "bass": (0.5, 1.5, 2.5, 3.5), "lead": (0.75, 1.75, 3)},
}


def add_stereo(mix, sample, start, gain, pan=0.0):
    offset = round(start * RATE)
    count = min(len(sample), len(mix) - offset)
    if count <= 0:
        return
    angle = (pan + 1) * math.pi / 4
    mix[offset:offset + count, 0] += sample[:count] * gain * math.cos(angle)
    mix[offset:offset + count, 1] += sample[:count] * gain * math.sin(angle)


def note(pitch, length, voice):
    t = np.arange(round(length * RATE)) / RATE
    phase = 2 * np.pi * 440 * 2 ** ((pitch - 69) / 12) * t
    if voice == "nylon":
        sound = np.sin(phase) + 0.34 * np.sin(2 * phase) * np.exp(-7 * t) + 0.18 * np.sin(3 * phase) * np.exp(-13 * t)
        attack, decay = 0.007, 2.9
    elif voice == "vibes":
        sound = np.sin(phase) + 0.22 * np.sin(3.997 * phase) * np.exp(-10 * t)
        sound *= 0.88 + 0.12 * np.sin(2 * np.pi * 4.4 * t)
        attack, decay = 0.011, 1.7
    elif voice == "pluck":
        sound = np.sin(phase + 0.8 * np.exp(-12 * t) * np.sin(2 * phase)) + 0.15 * np.sin(2 * phase)
        attack, decay = 0.008, 3.1
    elif voice == "pad":
        sound = 0.44 * (np.sin(phase) + np.sin(1.003 * phase) + np.sin(0.997 * phase))
        attack, decay = 0.22, 0.5
    elif voice == "bass":
        sound = np.sin(phase) + 0.35 * np.sin(2 * phase) + 0.07 * np.sin(3 * phase)
        attack, decay = 0.012, 1.4
    else:
        mod = 0.95 * np.exp(-5.6 * t) * np.sin(2 * phase)
        sound = np.sin(phase + mod) + 0.15 * np.sin(3 * phase) * np.exp(-5 * t)
        attack, decay = 0.014, 1.8
    ramp_in = np.minimum(t / attack, 1)
    ramp_out = np.clip((length - t) / 0.075, 0, 1)
    return sound * ramp_in * ramp_out * np.exp(-decay * t)


def drums(rng):
    t = np.arange(int(0.32 * RATE)) / RATE
    kick_phase = 2 * np.pi * (46 * t + (110 / 29) * (1 - np.exp(-29 * t)))
    kick = np.sin(kick_phase) * np.exp(-t * 16) * np.minimum(t / 0.008, 1)
    noise = rng.standard_normal(len(t))
    hat = np.diff(noise, prepend=0) * np.exp(-t * 78) * 0.30
    brush = np.convolve(noise, [0.2, 0.6, 0.2], mode="same") * np.exp(-t * 27) * 0.53
    brush += 0.25 * np.sin(2 * np.pi * 172 * t) * np.exp(-t * 34)
    return {"kick": kick, "snare": brush, "hat": hat}


def move_into_octave(pitch, start):
    return start + (pitch - start) % 12


def render(key, score, order):
    bpm, style, chord_voice, lead_voice, progression, motif = score
    rng = np.random.default_rng(61 + order * 103)
    beat = 60 / bpm
    seconds = BARS * 4 * beat
    groove = GROOVES[style]
    mix = np.zeros((round(seconds * RATE), 2))
    percussion = drums(rng)
    rhythm = {"kick": .28, "snare": .10, "hat": .048}
    if style in ("bossa", "swing", "air"):
        rhythm = {"kick": .14, "snare": .067, "hat": .032}

    for bar in range(BARS):
        root, intervals = progression[bar % len(progression)]
        chord = tuple(move_into_octave(root + interval, 55) for interval in intervals)
        start = bar * 4
        for instrument, level in rhythm.items():
            for offset in groove[instrument]:
                swing = float(rng.uniform(0, .011))
                velocity = float(rng.uniform(.86, 1.06))
                add_stereo(mix, percussion[instrument], (start + offset) * beat + swing, level * velocity, .34 if instrument == "hat" else 0)
        for index, offset in enumerate(groove["bass"]):
            bass = move_into_octave(root + (7 if index % 2 else 0), 35)
            sound = note(bass, beat * (.55 if style == "funk" else .84), "bass")
            add_stereo(mix, sound, (start + offset) * beat, .235 if style in ("funk", "house") else .19)
        for offset in groove["chords"]:
            for index, pitch in enumerate(chord):
                length = beat * (1.62 if chord_voice == "pad" else .91)
                sound = note(pitch, length, chord_voice)
                add_stereo(mix, sound, (start + offset) * beat + index * .009, .089, -.53 + index * .32)
        for index, offset in enumerate(groove["lead"]):
            degree = motif[(bar * 2 + index) % len(motif)]
            pitch = move_into_octave(root + intervals[degree % 4], 69)
            if degree == 4:
                pitch += 5
            length = beat * (.92 if index == len(groove["lead"]) - 1 else .57)
            sound = note(pitch, length, lead_voice)
            position = (start + offset) * beat
            add_stereo(mix, sound, position, .16, .13)
            add_stereo(mix, sound, position + .167, .025, -.56)

    # A short boundary fade avoids a click when the browser loops the clip.
    fade_in = round(.036 * RATE)
    fade_out = round(.20 * RATE)
    mix[:fade_in] *= np.linspace(0, 1, fade_in)[:, None]
    mix[-fade_out:] *= np.linspace(1, 0, fade_out)[:, None]
    peak = np.max(np.abs(mix))
    mix *= .80 / peak
    windows = np.array_split(mix, 48)
    energies = [float(np.sqrt(np.mean(window ** 2))) for window in windows]
    wave = [round(22 + 75 * energy / max(energies)) for energy in energies]
    destination = SITE / "assets" / "tracks" / f"{key}.mp3"
    pcm = (mix * 32767).astype("<i2").tobytes()
    subprocess.run(
        ["ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
         "-f", "s16le", "-ar", str(RATE), "-ac", "2", "-i", "pipe:0",
         "-c:a", "libmp3lame", "-b:a", "48k", "-metadata", "artist=Sofra FM",
         "-metadata", f"title={key}", str(destination)],
        input=pcm, check=True,
    )
    return {"duration": round(seconds, 2), "wave": wave}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.parse_args()
    (SITE / "assets" / "tracks").mkdir(parents=True, exist_ok=True)
    entries = {key: render(key, score, order) for order, (key, score) in enumerate(SCORES.items())}
    body = "\n".join(f"  {json.dumps(key)}: {json.dumps(entry, separators=(',', ':'))}," for key, entry in entries.items())
    (SITE / "assets" / "track-data.js").write_text(f'"use strict";\n\nconst trackData = {{\n{body}\n}};\n', encoding="utf-8")


if __name__ == "__main__":
    main()
