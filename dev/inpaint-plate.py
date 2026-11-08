"""A region repainted by the Couch "Top Gun pixel scene – inpaint 16:9" workflow → back into a dock plate (doc 93).

Usage: python3 -I dev/inpaint-plate.py <plate.png> <pixel-output.png> <mask.png> <out.png> [front-mask.png]

The plate is a 320 x 180 indexed dock picture; the pixel output is the workflow's 1280 x 720 preview (nearest x4 of its
320 x 180 art grid); the mask is the 320 x 180 black-and-white mask the run used (white = repainted). Inside the mask,
grown by the workflow's soft edge, the plate takes the output's pixels; outside it stays exactly as it was. The plate keeps
its own 48 colours and gains at most EXTRA new ones from the repainted region, so the rest of the picture keeps its indices.
With a fifth argument it also writes the walk-behind mask: the repainted pixels that differ from the plate (doc 92).
"""
import sys

from PIL import Image, ImageChops, ImageFilter

GRID = (320, 180)
EXTRA = 16
EDGE = 5  # art px: the workflow's GrowMask (8 logical px) plus its blur


def merged(plate, out, mask):
    grown = mask.filter(ImageFilter.MaxFilter(EDGE * 2 + 1))
    rgb = plate.convert('RGB')
    rgb.paste(out, (0, 0), grown)
    return rgb, grown


def reindexed(plate, rgb, grown):
    region = Image.new('RGB', GRID)
    region.paste(rgb, (0, 0), grown)
    extra = region.crop(grown.getbbox()).quantize(colors=EXTRA, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE)
    colours = plate.getpalette()[: 48 * 3] + extra.getpalette()[: EXTRA * 3]
    pal = Image.new('P', (1, 1))
    pal.putpalette(colours + [0] * (768 - len(colours)))
    return rgb.quantize(palette=pal, dither=Image.Dither.NONE)


def front_mask(plate, rgb, grown):
    diff = ImageChops.difference(plate.convert('RGB'), rgb).convert('L').point(lambda v: 255 if v > 24 else 0)
    return ImageChops.multiply(diff, grown)


if __name__ == '__main__':
    plate_path, out_path, mask_path, dest = sys.argv[1:5]
    plate = Image.open(plate_path)
    out = Image.open(out_path).convert('RGB').resize(GRID, Image.NEAREST)
    mask = Image.open(mask_path).convert('L').resize(GRID, Image.NEAREST)
    rgb, grown = merged(plate, out, mask)
    reindexed(plate, rgb, grown).save(dest, optimize=True)
    print(dest)
    if len(sys.argv) > 5:
        front_mask(plate, rgb, grown).save(sys.argv[5], optimize=True)
        print(sys.argv[5])
