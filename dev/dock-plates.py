"""Home docks (doc 73): the generated dock renders → the base's backdrops.

Usage: python3 -I dev/dock-plates.py src/assets/docks space=<space-raw.png> sea=<sea-raw.png>

Box-downscales each 1280 x 720 render of the "Top Gun pixel scene 16:9" workflow to the 320 x 180 art grid and
quantizes it to 48 colours of its own (median cut, no dither), saved as indexed PNGs <look>.png (any of the looks given;
the sea lounge D41 since doc 93).
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
    out_dir = sys.argv[1]
    os.makedirs(out_dir, exist_ok=True)
    for pair in sys.argv[2:]:
        look, raw = pair.split('=', 1)
        convert(raw, os.path.join(out_dir, f'{look}.png'))
