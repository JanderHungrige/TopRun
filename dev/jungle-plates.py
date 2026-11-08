"""The jungle camp L121 (doc 95): the generated render → the base's backdrop and its walk-behind mask.

Usage: python3 -I dev/jungle-plates.py <jungle-raw.png> src/assets/docks

Box-downscales the 1280 x 720 render to the 320 x 180 art grid with 48 colours (like dev/dock-plates.py) and writes
jungle-front.png, white where the camp's foreground stands in front of the pilot's walk: the board-game table's top
and the stool, the sandbags, the map table (top, apron, legs, the box on it), the TV and the radio on their crates
with the lamp. The polygons are in logical px (1280 x 720).
"""
import os
import sys

from PIL import Image, ImageDraw

GRID = (320, 180)
COLOURS = 48

FRONT = [
    # the board-game table's top with the chess board and the game boxes
    [(78, 548), (98, 498), (240, 496), (256, 504), (340, 516), (406, 530), (406, 562), (300, 602), (80, 582)],
    # the stool
    [(315, 594), (442, 594), (442, 720), (315, 720)],
    # the sandbags
    [(0, 478), (166, 478), (166, 626), (0, 626)],
    # the map table's top and apron, the box on it
    [(758, 535), (905, 502), (1032, 516), (1086, 516), (1140, 546), (1140, 562), (1022, 616), (758, 560)],
    # its left and front legs
    [(778, 545), (797, 545), (797, 690), (778, 690)],
    [(1018, 596), (1042, 596), (1042, 720), (1018, 720)],
    # the TV, the radio and their crates, the lamp
    [(1108, 428), (1280, 428), (1280, 720), (1108, 720)],
    [(1058, 334), (1226, 334), (1226, 402), (1058, 402)],
]


def front_mask(path):
    m = Image.new('L', (1280, 720), 0)
    d = ImageDraw.Draw(m)
    for poly in FRONT:
        d.polygon(poly, fill=255)
    m.resize(GRID, Image.BOX).point(lambda v: 255 if v >= 128 else 0).save(path, optimize=True)
    print(path)


if __name__ == '__main__':
    raw, out_dir = sys.argv[1:3]
    plate = Image.open(raw).convert('RGB').resize(GRID, Image.BOX)
    dest = os.path.join(out_dir, 'jungle.png')
    plate.quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(dest, optimize=True)
    print(dest)
    front_mask(os.path.join(out_dir, 'jungle-front.png'))
