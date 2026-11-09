"""World celebrations (doc 64) and welcome films (doc 97): the generated key frames → the game's plates.

Usage: python3 -I dev/finale-plates.py <raw-dir> src/assets/finales [world ...]
       python3 -I dev/finale-plates.py --intro <raw-dir> src/assets/intros [world ...]

Reads <raw-dir>/w<world><shot>-raw_00001_.png (shots a, b, c; the 1280 x 720 renders of the
"Top Gun pixel scene 16:9" workflow), box-downscales each to the 320 x 180 art grid, builds one shared
48-colour palette per world (median cut over the three shots, no dither) and writes indexed PNGs
w<world><shot>.png. Without worlds, every world whose three renders exist is converted. With --intro it reads
i<world><shot>-raw_00001_.png for the four shots a–d of a welcome film and writes i<world><shot>.png.
"""
import os
import sys

from PIL import Image

GRID = (320, 180)
COLOURS = 48
KINDS = {'w': 'abc', 'i': 'abcd'}  # the celebrations' three shots, the welcome films' four


def plates(raw_dir, world, kind):
    paths = [os.path.join(raw_dir, f'{kind}{world}{s}-raw_00001_.png') for s in KINDS[kind]]
    if not all(os.path.exists(p) for p in paths):
        return None
    return [Image.open(p).convert('RGB').resize(GRID, Image.BOX) for p in paths]


def convert(raw_dir, out_dir, world, kind):
    imgs = plates(raw_dir, world, kind)
    if imgs is None:
        print(f'world {world}: renders missing, skipped')
        return
    strip = Image.new('RGB', (GRID[0], GRID[1] * len(imgs)))
    for i, im in enumerate(imgs):
        strip.paste(im, (0, GRID[1] * i))
    pal = strip.quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    for s, im in zip(KINDS[kind], imgs):
        out = im.quantize(palette=pal, dither=Image.Dither.NONE)
        path = os.path.join(out_dir, f'{kind}{world}{s}.png')
        out.save(path, optimize=True)
        print(path, os.path.getsize(path), 'bytes')


def main():
    args = sys.argv[1:]
    kind = 'i' if args[:1] == ['--intro'] else 'w'
    if kind == 'i':
        args = args[1:]
    raw_dir, out_dir = args[0], args[1]
    worlds = [int(w) for w in args[2:]] or ([3, 4, 5, 6] if kind == 'i' else [1, 2, 3, 4])
    os.makedirs(out_dir, exist_ok=True)
    for w in worlds:
        convert(raw_dir, out_dir, w, kind)


if __name__ == '__main__':
    main()
