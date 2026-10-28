"""Hangar item pictures (doc 02): a generated item on flat magenta -> <id>.png (192 x 192) and <id>-small.png (72 x 40).

Usage: python3 dev/item-pictures.py <raw.png> <id> [colours]

<raw.png> is a text-to-image render of one item, lying horizontally with its nose to the right, on a flat magenta
background (ComfyUI workflow 'Top Gun pixel crew portrait' on the M4: 768 x 768, see doc 02 for the prompt style).
The magenta is keyed out (flood fill from the edges plus enclosed magenta holes), the item is cropped to its bounding
box and scaled with premultiplied area averaging so no magenta bleeds into the rim, to 166 px wide (the width of the
other pictures), reduced to a small palette (default 24 colours) and centred on 192 x 192. The list icon is the same
item fitted into 72 x 40 and mapped onto the big picture's palette. Both are written to src/assets/items/.
"""
from __future__ import annotations

import sys
from collections import deque

import numpy as np
from PIL import Image

OUT = 'src/assets/items'
BIG, BIG_W = 192, 166
SMALL_W, SMALL_H = 72, 40
# A pixel further than this from its median-cut colour keeps its own (doc 02: small glowing details survive).
ACCENT = 70


def magenta(rgb: np.ndarray) -> np.ndarray:
    """Background candidates: strong red and blue, little green (the model's magenta drifts towards pink)."""
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    return (r > 150) & (b > 80) & (g < 110) & (r - g > 110) & (b - g > 40)


def key(rgb: np.ndarray) -> np.ndarray:
    """Alpha mask: False for magenta connected to the border, and for enclosed pure-magenta holes."""
    cand = magenta(rgb)
    h, w = cand.shape
    bg = np.zeros_like(cand)
    q = deque((y, x) for y in range(h) for x in (0, w - 1) if cand[y, x])
    q.extend((y, x) for x in range(w) for y in (0, h - 1) if cand[y, x])
    while q:
        y, x = q.popleft()
        if bg[y, x] or not cand[y, x]:
            continue
        bg[y, x] = True
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not bg[ny, nx] and cand[ny, nx]:
                q.append((ny, nx))
    r, g, b = (rgb[..., i].astype(int) for i in range(3))
    hole = (r > 200) & (g < 60) & (b > 120)
    return ~(bg | hole)


def area(rgb: np.ndarray, alpha: np.ndarray, w: int, h: int) -> tuple[np.ndarray, np.ndarray]:
    """Premultiplied box downscale: colour from opaque pixels only, coverage as alpha."""
    a = alpha.astype(np.float32)
    pre = Image.fromarray((rgb * a[..., None]).astype(np.uint8))
    cov = Image.fromarray((a * 255).astype(np.uint8))
    pre_s = np.asarray(pre.resize((w, h), Image.BOX)).astype(np.float32)
    cov_s = np.asarray(cov.resize((w, h), Image.BOX)).astype(np.float32) / 255
    col = pre_s / np.maximum(cov_s[..., None], 1e-3)
    return np.clip(col, 0, 255).astype(np.uint8), cov_s >= 0.5


def fit(rgb: np.ndarray, alpha: np.ndarray, max_w: int, max_h: int) -> tuple[np.ndarray, np.ndarray]:
    ys, xs = np.nonzero(alpha)
    rgb, alpha = rgb[ys.min():ys.max() + 1, xs.min():xs.max() + 1], alpha[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    k = min(max_w / alpha.shape[1], max_h / alpha.shape[0])
    return area(rgb, alpha, max(1, round(alpha.shape[1] * k)), max(1, round(alpha.shape[0] * k)))


def place(rgb: np.ndarray, alpha: np.ndarray, w: int, h: int) -> Image.Image:
    out = np.zeros((h, w, 4), np.uint8)
    y0, x0 = (h - alpha.shape[0]) // 2, (w - alpha.shape[1]) // 2
    out[y0:y0 + alpha.shape[0], x0:x0 + alpha.shape[1], :3] = rgb
    out[y0:y0 + alpha.shape[0], x0:x0 + alpha.shape[1], 3] = np.where(alpha, 255, 0)
    out[..., :3][out[..., 3] == 0] = 0
    return Image.fromarray(out, 'RGBA')


def reduce(rgb: np.ndarray, colours: int) -> np.ndarray:
    """Median cut to `colours` - 4; pixels it maps far off (a small glowing ring, a lamp) get up to 4 colours of their own."""
    q = np.asarray(Image.fromarray(rgb).quantize(colours - 4, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB'))
    lost = np.linalg.norm(rgb.astype(int) - q.astype(int), axis=-1) > ACCENT
    if not lost.any():
        return q
    strip = Image.fromarray(rgb[lost][None])
    accents = np.asarray(strip.quantize(4, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB'))[0]
    out = q.copy()
    out[lost] = accents
    return out


def onto(rgb: np.ndarray, palette: np.ndarray) -> np.ndarray:
    """Every pixel to its nearest palette colour."""
    d = np.linalg.norm(rgb[..., None, :].astype(int) - palette[None, None].astype(int), axis=-1)
    return palette[d.argmin(-1)].astype(np.uint8)


def main() -> None:
    raw, item = sys.argv[1], sys.argv[2]
    colours = int(sys.argv[3]) if len(sys.argv) > 3 else 24
    rgb = np.asarray(Image.open(raw).convert('RGB'))
    alpha = key(rgb)
    big_rgb, big_a = fit(rgb, alpha, BIG_W, BIG - 16)
    big_rgb = reduce(big_rgb, colours)
    place(big_rgb, big_a, BIG, BIG).save(f'{OUT}/{item}.png')
    small_rgb, small_a = fit(rgb, alpha, SMALL_W - 2, SMALL_H - 4)
    small_rgb = onto(small_rgb, np.unique(big_rgb[big_a], axis=0))
    place(small_rgb, small_a, SMALL_W, SMALL_H).save(f'{OUT}/{item}-small.png')
    print(f'{item}: {big_a.shape[1]}x{big_a.shape[0]} in {BIG}x{BIG}, small {small_a.shape[1]}x{small_a.shape[0]}, {colours} colours')


if __name__ == '__main__':
    main()
