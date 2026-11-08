"""The carrier lounge (doc 91): the room renders + the hangar hall renders -> the base's day, evening and night pictures.

Usage: python3 -I dev/carrier-plates.py <room-day> <room-evening> <room-night> <hall-day> <hall-evening> <hall-night> src/assets/docks

The rooms are 1280 x 720 renders of the "Top Gun pixel scene" workflows' pixel branch (the night room picture D, day and
evening its frozen edits): each is sampled at its art-pixel centres onto the 320 x 180 grid. The halls are 720 x 1216
renders of the hall seen through the room's steel door (day and evening from one seed, night the day hall frozen and
relit): cut to the door's 36 : 61, box-downscaled into the door (art px 192-228 x 60-121). Each picture is quantized to 48
colours of its own (median cut, no dither) and saved as carrier-<light>.png.
"""
import os
import sys

from PIL import Image

GRID = (320, 180)
COLOURS = 48
DOOR = (192, 60, 228, 121)
HALL_CROP = (60, 170, 660, 1186)
LIGHTS = ('day', 'evening', 'night')


def room(path):
    return Image.open(path).convert('RGB').resize(GRID, Image.NEAREST, box=(0, 0, 1280, 720))


def build(room_path, hall_path, out):
    img = room(room_path)
    x0, y0, x1, y1 = DOOR
    hall = Image.open(hall_path).convert('RGB').crop(HALL_CROP).resize((x1 - x0, y1 - y0), Image.BOX)
    img.paste(hall, (x0, y0))
    img.quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(out, optimize=True)
    print(out, os.path.getsize(out), 'bytes')


if __name__ == '__main__':
    rooms, halls, out_dir = sys.argv[1:4], sys.argv[4:7], sys.argv[7]
    os.makedirs(out_dir, exist_ok=True)
    for light, r, h in zip(LIGHTS, rooms, halls):
        build(r, h, os.path.join(out_dir, f'carrier-{light}.png'))
