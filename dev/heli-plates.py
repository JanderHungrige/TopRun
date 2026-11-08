"""The helicopter base (doc 92): the room renders + the outside views -> the base's day, evening and night pictures and the
map table's walk-behind mask.

Usage: python3 -I dev/heli-plates.py <room-day> <room-evening> <room-night> <out-day> <out-evening> <out-night> src/assets/docks

The rooms are 1280 x 720 renders of the "Top Gun pixel scene" workflows' pixel branch (the night room K2 with its chalkboard
widened, day and evening its frozen edits): each is sampled at its art-pixel centres onto the 320 x 180 grid. The outside
views are pixel-branch renders of the view out of the gate (K1's, cut out of it; day and evening its frozen edits), on
their own art grid: each is box-scaled into the gate (GATE, art px). Each picture is quantized to 48 colours of its own
(median cut, no dither) and saved as heli-<light>.png. heli-front.png marks the map table and its lamp (white): the pixels
the game draws again over the pilot.
"""
import os
import sys

from PIL import Image, ImageDraw

GRID = (320, 180)
COLOURS = 48
GATE = (206, 44, 294, 126)  # the open gate's opening, art px (x0, y0, x1, y1)
LIGHTS = ('day', 'evening', 'night')
# The map table's top and front, and the lamp on it, as polygons in logical px (1280 x 720).
TABLE = [(768, 590), (1000, 492), (1270, 520), (1280, 520), (1280, 720), (786, 720), (768, 640)]
LAMP = [(1108, 372), (1176, 372), (1240, 420), (1262, 520), (1262, 656), (1176, 656), (1150, 470), (1108, 430)]


def art(path, size=GRID):
    im = Image.open(path).convert('RGB')
    return im.resize(size, Image.NEAREST, box=(0, 0, size[0] * 4, size[1] * 4))


def build(room_path, out_path, keep, dest):
    img = art(room_path)
    x0, y0, x1, y1 = GATE
    view = Image.open(out_path).convert('RGB')
    view = view.resize((view.width // 8, view.height // 8), Image.NEAREST, box=(0, 0, view.width // 8 * 8, view.height // 8 * 8)) if view.width > 200 else view
    outside = img.copy()
    outside.paste(view.resize((x1 - x0, y1 - y0), Image.BOX), (x0, y0))
    img = Image.composite(img, outside, keep)  # the lamp in front of the gate stays the room's
    img.quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(dest, optimize=True)
    print(dest, os.path.getsize(dest), 'bytes')


def front_mask():
    mask = Image.new('L', (1280, 720), 0)
    d = ImageDraw.Draw(mask)
    d.polygon(TABLE, fill=255)
    d.polygon(LAMP, fill=255)
    return mask.resize(GRID, Image.BOX).point(lambda v: 255 if v >= 128 else 0).convert('1')


if __name__ == '__main__':
    rooms, outs, out_dir = sys.argv[1:4], sys.argv[4:7], sys.argv[7]
    os.makedirs(out_dir, exist_ok=True)
    keep = front_mask()
    for light, r, o in zip(LIGHTS, rooms, outs):
        build(r, o, keep, os.path.join(out_dir, f'heli-{light}.png'))
    dest = os.path.join(out_dir, 'heli-front.png')
    keep.save(dest, optimize=True)
    print(dest, os.path.getsize(dest), 'bytes')
