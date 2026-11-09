"""The helicopter base (doc 92): the room renders + the outside views -> the base's day, evening and night pictures and the
map table's walk-behind mask.

Usage: python3 -I dev/heli-plates.py <room-day> <room-evening> <room-night> <out-day> <out-evening> <out-night> src/assets/docks

The rooms are 1280 x 720 renders of the "Top Gun pixel scene" workflows' pixel branch (the night room K2 with its chalkboard
widened, day and evening its frozen edits): each is sampled at its art-pixel centres onto the 320 x 180 grid. The outside
views are pixel-branch renders of the view out of the gate (K1's, cut out of it; day and evening its frozen edits), on
their own art grid: each is box-scaled into the gate's box (GATE, art px) but shows only in the opening — under the
slanting beam (BEAM, measured on the night room), between the posts — with a pixel of shadow along the beam and the left
post. In front of it only the desk lamp's head stays the room's (the night room's dark pixels in the lamp's outline), not
the room's own floodlit apron around it. Each picture is quantized to 48 colours of its own (median cut, no dither) and
saved as heli-<light>.png. heli-front.png marks the map table and its lamp (white): the pixels the game draws again over
the pilot.
"""
import os
import sys

from PIL import Image, ImageDraw

GRID = (320, 180)
COLOURS = 48
GATE = (206, 44, 294, 126)  # the box the outside view is scaled into, art px (x0, y0, x1, y1)
# The beam over the gate slants: its lower edge runs from (206, 57) at the left post to (292, 45) at the right (doc 92 B1).
BEAM = ((206, 57), (292, 45))
DARK = 70  # the lamp head's pixels are darker than this (luma)
LIGHTS = ('day', 'evening', 'night')
# The map table's top and front, and the lamp on it, as polygons in logical px (1280 x 720).
TABLE = [(768, 590), (1000, 492), (1270, 520), (1280, 520), (1280, 720), (786, 720), (768, 640)]
LAMP = [(1108, 372), (1176, 372), (1240, 420), (1262, 520), (1262, 656), (1176, 656), (1150, 470), (1108, 430)]


def art(path, size=GRID):
    im = Image.open(path).convert('RGB')
    return im.resize(size, Image.NEAREST, box=(0, 0, size[0] * 4, size[1] * 4))


def beam_y(x):
    (ax, ay), (bx, by) = BEAM
    return round(ay + (by - ay) * (x - ax) / (bx - ax))


def opening():
    """The gate's opening (white): under the slanting beam, between the posts, down to the threshold."""
    m = Image.new('L', GRID, 0)
    d = ImageDraw.Draw(m)
    x0, _, x1, y1 = GATE
    for x in range(x0, x1):
        d.line([(x, beam_y(x)), (x, y1 - 1)], fill=255)
    return m


def lamp_head(night_room, gate):
    """The desk lamp's head and arm where they stand in front of the opening: the night room's dark pixels there."""
    outline = Image.new('L', GRID, 0)
    ImageDraw.Draw(outline).polygon([(x / 4, y / 4) for x, y in LAMP], fill=255)
    dark = night_room.convert('L').point(lambda v: 255 if v < DARK else 0)
    return Image.composite(dark, Image.new('L', GRID, 0), Image.composite(outline, Image.new('L', GRID, 0), gate))


def shaded(view):
    """The view with a pixel of shadow under the beam and inside the left post, so it sits behind the frame."""
    out = view.copy()
    px = out.load()
    x0, y0, x1, _ = GATE
    for x in range(x0, x1):
        for dy, k in ((0, 0.55), (1, 0.8)):
            y = beam_y(x) - y0 + dy
            r, g, b = px[x - x0, y]
            px[x - x0, y] = (int(r * k), int(g * k), int(b * k))
    for y in range(beam_y(x0) - y0, out.height):
        for dx, k in ((0, 0.6), (1, 0.85)):
            r, g, b = px[dx, y]
            px[dx, y] = (int(r * k), int(g * k), int(b * k))
    return out


def build(room_path, out_path, gate, head, dest):
    img = art(room_path)
    x0, y0, x1, y1 = GATE
    view = Image.open(out_path).convert('RGB')
    view = view.resize((view.width // 8, view.height // 8), Image.NEAREST, box=(0, 0, view.width // 8 * 8, view.height // 8 * 8)) if view.width > 200 else view
    fitted = view.resize((x1 - x0, y1 - y0), Image.BOX)
    # The palette is the one the first version had (the view's whole box pasted, the lamp's outline kept), so the room
    # keeps its colours exactly; only the opening changes.
    first = img.copy()
    first.paste(fitted, (x0, y0))
    palette = Image.composite(img, first, front_mask()).quantize(colors=COLOURS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    outside = img.copy()
    outside.paste(shaded(fitted), (x0, y0))
    shows = Image.composite(Image.new('L', GRID, 0), gate, head)  # the opening, minus the lamp head in front of it
    img = Image.composite(outside, img, shows)
    img.quantize(palette=palette, dither=Image.Dither.NONE).save(dest, optimize=True)
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
    gate = opening()
    head = lamp_head(art(rooms[2]), gate)
    for light, r, o in zip(LIGHTS, rooms, outs):
        build(r, o, gate, head, os.path.join(out_dir, f'heli-{light}.png'))
    dest = os.path.join(out_dir, 'heli-front.png')
    keep.save(dest, optimize=True)
    print(dest, os.path.getsize(dest), 'bytes')
