"""Ceremony layers (doc 25), cut-out geometry: keying the magenta, splitting the two officers and patching the crew
row. Used by dev/ceremony-layers.py."""
import numpy as np
from PIL import Image

W, H = 320, 180
# The crew row on the art grid (x, y, w, h): its crop edits (helmets, salute) go back here.
CREW = (50, 80, 160, 60)


def key_mask(im):
    """True where an edit on flat magenta shows a figure. Edge pixels the model blended into the magenta (pink-tinted,
    next to the background) are dropped twice over; the dark outlines stay."""
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    fig = ~((r > 170) & (g < 100) & (b > 70) & (r - g > 110))
    pinkish = (r - g > 55) & (b - g > 15)
    for _ in range(2):
        edge = np.zeros_like(fig)
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            edge |= ~np.roll(np.roll(fig, dy, 0), dx, 1)
        fig &= ~(edge & pinkish)
    return fig


def split_column(im, mask):
    """Where the pilot (left) ends and the admiral (right) begins: the middle of the widest empty column run between
    them, or, when their hands touch (the pin), just left of the gold medal the admiral holds."""
    w = mask.shape[1]
    lo, hi = int(0.4 * w), int(0.62 * w)
    empty = [x for x in range(lo, hi) if not mask[:, x].any()]
    if empty:
        runs, start = [], empty[0]
        for a, b in zip(empty, empty[1:] + [None]):
            if b != a + 1:
                runs.append((start, a))
                start = b
        a, b = max(runs, key=lambda r: r[1] - r[0])
        return (a + b) // 2
    r, g, bl = im[..., 0], im[..., 1], im[..., 2]
    gold = (r > 170) & (g > 120) & (bl < 100) & mask
    xs = np.nonzero(gold[:, lo:hi].any(axis=0))[0]
    return lo + int(xs.min()) - 3 if len(xs) else (lo + hi) // 2


def to_grid(im, mask):
    """A keyed full-size figure -> RGBA on the 320 x 180 grid (alpha: at least half covered)."""
    alpha = mask.astype(float)
    big = np.dstack([im * alpha[..., None], alpha * 255])
    small = np.asarray(Image.fromarray(big.astype('uint8'), 'RGBA').resize((W, H), Image.BOX)).astype(float)
    a = small[..., 3] / 255
    rgb = np.where(a[..., None] > 0, small[..., :3] / np.maximum(a[..., None], 1e-6), 0)
    return Image.fromarray(np.dstack([np.clip(rgb, 0, 255), np.where(a >= 0.5, 255, 0)]).astype('uint8'), 'RGBA')


# Where the hands touch, the cut is set by eye (fraction of the width): the pin's medal stays with the admiral.
CUTS = {'raw-pin': 382 / 768}
# Salutes where the admiral still holds out the medal: his fist is under her / his raised elbow, so the cut steps
# (768-wide px: above row y the pilot keeps x < a, below it x < b).
STEP_CUTS = {'raw-woman-salute': (183, 392, 382), 'raw-man-long-salute': (183, 392, 382)}


def split_figures(path, raw):
    """A pose edit (both officers on magenta) -> the image and the (pilot, admiral) masks at full size."""
    im = np.asarray(Image.open(path).convert('RGB')).astype(float)
    mask = key_mask(im)
    if raw in STEP_CUTS:
        y, a, b = STEP_CUTS[raw]
        xs = np.arange(mask.shape[1])[None, :]
        ys = np.arange(mask.shape[0])[:, None]
        pilot = (ys < y) & (xs < a) | (ys >= y) & (xs < b)
        return im, mask & pilot, mask & ~pilot
    cut = round(CUTS[raw] * mask.shape[1]) if raw in CUTS else split_column(im, mask)
    left = mask.copy()
    left[:, cut:] = False
    right = mask.copy()
    right[:, :cut] = False
    return im, left, right


def figures(path, raw):
    """A pose edit -> (pilot, admiral) RGBA layers on the grid."""
    im, left, right = split_figures(path, raw)
    return to_grid(im, left), to_grid(im, right)


def crop_grid(path):
    """An enlarged crew-row crop (1024 x 384) back at its size on the 320 x 180 grid (CREW w x h)."""
    return np.asarray(Image.open(path).convert('RGB').resize((CREW[2], CREW[3]), Image.BOX)).astype(int)


def changed(src, edit):
    """Where an edit of a crop differs from its source (dilated by one art px)."""
    diff = np.abs(src - edit).sum(axis=2) > 60
    d = diff.copy()
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            d |= np.roll(np.roll(diff, dy, 0), dx, 1)
    return d


def patch_crew(plate, src_path, edit_path):
    """The crew row's edit (helmets) pasted into the plate where it changed anything."""
    src, edit = crop_grid(src_path), crop_grid(edit_path)
    a = np.asarray(plate).copy()
    cx, cy, cw, ch = CREW
    region = a[cy:cy + ch, cx:cx + cw]
    m = changed(src, edit)
    region[m] = edit[m]
    return Image.fromarray(a)


def crew_overlay(src_path, edit_path):
    """The saluting crew: only the pixels the salute edit changed, as an RGBA layer over the whole frame."""
    src, edit = crop_grid(src_path), crop_grid(edit_path)
    out = np.zeros((H, W, 4), 'uint8')
    cx, cy, cw, ch = CREW
    m = changed(src, edit)
    out[cy:cy + ch, cx:cx + cw, :3] = edit
    out[cy:cy + ch, cx:cx + cw, 3] = np.where(m, 255, 0)
    return Image.fromarray(out, 'RGBA')
