"""Campaign map pictures (doc 77): the M1's repaint of a map's layout → the map panel's art grid.

Usage: python3 -I dev/map-pictures.py <out dir> <c>=<raw.png> [<c>=<raw.png> ...]

Each raw is the 1040 x 768 edit of the map's static layer (exported at the panel's 846 x 628 and scaled up for the
model). It is scaled back to the panel, box-downscaled to its art grid (212 x 157, 4 logical px per art px) and quantized
to 48 colours of its own (median cut, no dither), saved as the indexed PNG <out dir>/map<c>.png.
"""
import os
import sys

from PIL import Image

PANEL = (846, 628)
GRID = (212, 157)
COLOURS = 48


def convert(src, out):
    im = Image.open(src).convert('RGB').resize(PANEL, Image.LANCZOS).resize(GRID, Image.BOX)
    im.quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(out, optimize=True)
    print(out, os.path.getsize(out), 'bytes')


if __name__ == '__main__':
    out_dir = sys.argv[1]
    os.makedirs(out_dir, exist_ok=True)
    for pair in sys.argv[2:]:
        c, src = pair.split('=', 1)
        convert(src, os.path.join(out_dir, f'map{c}.png'))
