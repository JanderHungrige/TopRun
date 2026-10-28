"""Locker (doc 31): the owner's pick (ComfyUI 'Top Gun pixel scene 16:9', locker v4) -> the locker backdrop on the
game's 320 x 180 grid with 32 flat colours, the tunic moved left so the card panel on the right stays clear.

usage: python3 -I -B dev/locker-plate.py <v4 1280x720 png> <out png>
"""
import sys

import numpy as np
from PIL import Image

W, H, COLORS = 320, 180, 32
# Logical px the picture moves left (a whole number of art px: 24 x 4): the tunic's centre lands at x 524, its right
# sleeve just left of the card panel, and the open door's edge with its vents stays in view (owner: option B).
SHIFT = 96


def main(src, dst):
    im = np.asarray(Image.open(src).convert('RGB'))
    out = np.empty_like(im)
    out[:, : im.shape[1] - SHIFT] = im[:, SHIFT:]
    # the uncovered right edge: the darkest shade of the lockers in shadow there, so it reads as more of them
    edge = im[:, -24:].reshape(-1, 3)
    out[:, im.shape[1] - SHIFT:] = edge[edge.sum(axis=1).argsort()[len(edge) // 10]]
    small = Image.fromarray(out).resize((W, H), Image.BOX)
    small.quantize(colors=COLORS, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(dst, optimize=True)


if __name__ == '__main__':
    main(*sys.argv[1:3])
