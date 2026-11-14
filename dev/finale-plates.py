"""World celebrations (doc 64) and welcome films (doc 97): the generated key frames → the game's plates.

Usage: python3 -I dev/finale-plates.py [--intro] [--accents N] <raw-dir> <out-dir> [world ...]
       e.g. python3 -I dev/finale-plates.py <raw-dir> src/assets/finales 7
            python3 -I dev/finale-plates.py --intro --accents 6 <raw-dir> src/assets/intros 7

Reads <raw-dir>/w<world><shot>-raw_00001_.png (shots a, b, c; the 1280 x 720 renders of the
"Top Gun pixel scene 16:9" workflow), box-downscales each to the 320 x 180 art grid, builds one shared
48-colour palette per world (median cut over the three shots, no dither) and writes indexed PNGs
w<world><shot>.png. Without worlds, every world whose three renders exist is converted. With --intro it reads
i<world><shot>-raw_00001_.png for the four shots a–d of a welcome film and writes i<world><shot>.png.
With --accents N (map 7's intro: 6) the median cut gets 48 - N colours and the last N go to the pixels it maps far off
(small glows the golden shots outvote: the aliens' magenta lights and teal trim, the violet of the mothership);
without it the palette is the plain median cut, as for worlds 1–6.
"""
import os
import sys

import numpy as np
from PIL import Image

GRID = (320, 180)
COLOURS = 48
ACCENT = 60  # a pixel further than this from its median-cut colour may take an accent colour
KINDS = {'w': 'abc', 'i': 'abcd'}  # the celebrations' three shots, the welcome films' four


def plates(raw_dir, world, kind):
    paths = [os.path.join(raw_dir, f'{kind}{world}{s}-raw_00001_.png') for s in KINDS[kind]]
    if not all(os.path.exists(p) for p in paths):
        return None
    return [Image.open(p).convert('RGB').resize(GRID, Image.BOX) for p in paths]


def shared_palette(strip, accents):
    """The world's palette: a plain 48-colour median cut, or 48 - accents of it plus accent colours for far-off pixels."""
    if not accents:
        return strip.quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    cut = strip.quantize(colors=COLOURS - accents, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    rgb = np.asarray(strip).astype(int)
    lost = np.linalg.norm(rgb - np.asarray(cut.convert('RGB')).astype(int), axis=-1) > ACCENT
    colours = cut.getpalette()[:3 * (COLOURS - accents)]
    if lost.any():
        far = Image.fromarray(rgb[lost][None].astype('uint8'))
        colours += far.quantize(accents, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).getpalette()[:3 * accents]
    pal = Image.new('P', (1, 1))
    pal.putpalette(colours + [0] * (768 - len(colours)))
    return pal


def convert(raw_dir, out_dir, world, kind, accents=0):
    imgs = plates(raw_dir, world, kind)
    if imgs is None:
        print(f'world {world}: renders missing, skipped')
        return
    strip = Image.new('RGB', (GRID[0], GRID[1] * len(imgs)))
    for i, im in enumerate(imgs):
        strip.paste(im, (0, GRID[1] * i))
    pal = shared_palette(strip, accents)
    for s, im in zip(KINDS[kind], imgs):
        out = im.quantize(palette=pal, dither=Image.Dither.NONE)
        path = os.path.join(out_dir, f'{kind}{world}{s}.png')
        out.save(path, optimize=True)
        print(path, os.path.getsize(path), 'bytes')


def main():
    args = sys.argv[1:]
    kind, accents = 'w', 0
    while args and args[0].startswith('--'):
        flag = args.pop(0)
        if flag == '--intro':
            kind = 'i'
        elif flag == '--accents':
            accents = int(args.pop(0))
        else:
            raise SystemExit(f'unknown option {flag}')
    raw_dir, out_dir = args[0], args[1]
    worlds = [int(w) for w in args[2:]] or ([3, 4, 5, 6] if kind == 'i' else [1, 2, 3, 4])
    os.makedirs(out_dir, exist_ok=True)
    for w in worlds:
        convert(raw_dir, out_dir, w, kind, accents)


if __name__ == '__main__':
    main()
