"""World celebrations (doc 64): the generated key frames → the game's plates.

Usage: python3 -I dev/finale-plates.py <raw-dir> src/assets/finales [world ...]

Reads <raw-dir>/w<world><shot>-raw_00001_.png (shots a, b, c; the 1280 x 720 renders of the
"Top Gun pixel scene 16:9" workflow), box-downscales each to the 320 x 180 art grid, builds one shared
48-colour palette per world (median cut over the three shots, no dither) and writes indexed PNGs
w<world><shot>.png. Without worlds, every world whose three renders exist is converted.
"""
import os
import sys

from PIL import Image

GRID = (320, 180)
COLOURS = 48
SHOTS = 'abc'


def plates(raw_dir, world):
    paths = [os.path.join(raw_dir, f'w{world}{s}-raw_00001_.png') for s in SHOTS]
    if not all(os.path.exists(p) for p in paths):
        return None
    return [Image.open(p).convert('RGB').resize(GRID, Image.BOX) for p in paths]


def convert(raw_dir, out_dir, world):
    imgs = plates(raw_dir, world)
    if imgs is None:
        print(f'world {world}: renders missing, skipped')
        return
    strip = Image.new('RGB', (GRID[0], GRID[1] * len(imgs)))
    for i, im in enumerate(imgs):
        strip.paste(im, (0, GRID[1] * i))
    pal = strip.quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    for s, im in zip(SHOTS, imgs):
        out = im.quantize(palette=pal, dither=Image.Dither.NONE)
        path = os.path.join(out_dir, f'w{world}{s}.png')
        out.save(path, optimize=True)
        print(path, os.path.getsize(path), 'bytes')


def main():
    raw_dir, out_dir = sys.argv[1], sys.argv[2]
    worlds = [int(w) for w in sys.argv[3:]] or [1, 2, 3, 4]
    os.makedirs(out_dir, exist_ok=True)
    for w in worlds:
        convert(raw_dir, out_dir, w)


if __name__ == '__main__':
    main()
