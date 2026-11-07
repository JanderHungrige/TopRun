"""Home docks (doc 73): the generated dock renders → the base's backdrops.

Usage: python3 -I dev/dock-plates.py <space-raw.png> <sea-raw.png> src/assets/docks

Box-downscales each 1280 x 720 render of the "Top Gun pixel scene 16:9" workflow to the 320 x 180 art grid and
quantizes it to 48 colours of its own (median cut, no dither), saved as indexed PNGs space.png and sea.png.
"""
import os
import sys

from PIL import Image

GRID = (320, 180)
COLOURS = 48


def convert(src, out):
    im = Image.open(src).convert('RGB').resize(GRID, Image.BOX)
    im.quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(out, optimize=True)
    print(out, os.path.getsize(out), 'bytes')


if __name__ == '__main__':
    space, sea, out_dir = sys.argv[1:4]
    os.makedirs(out_dir, exist_ok=True)
    convert(space, os.path.join(out_dir, 'space.png'))
    convert(sea, os.path.join(out_dir, 'sea.png'))
