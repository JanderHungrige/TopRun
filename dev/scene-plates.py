"""Generated scenes → the game's 320 x 180 backdrops (docs 73, 76): the loadout backgrounds, a new dock.

Usage: python3 -I dev/scene-plates.py <out dir> <name>=<raw.png> [<name>=<raw.png> ...]

Box-downscales each 1280 x 720 render of the "Top Gun pixel scene 16:9" workflow to the 320 x 180 art grid and quantizes
it to 48 colours of its own (median cut, no dither), saved as the indexed PNG <out dir>/<name>.png — the same grid as
dev/dock-plates.py.
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
        name, src = pair.split('=', 1)
        convert(src, os.path.join(out_dir, name + '.png'))
