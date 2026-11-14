import { limb, plateShell, shell } from '../detail/organic';
import { glow, plate } from '../detail/parts';
import type { DetailArt } from '../detail/unit';
import { alienMono, ink, metalInk, STEPPE_BOX, STEPPE_PAL, type AlienPal } from './steppe-pal';

// Shared pieces of the alien steppe's detailed army (doc 115): a kind's art from its palette and box, six scuttling
// legs, the troopers' domed helmet and their plasma rifle.

type Ctx = CanvasRenderingContext2D;

export const art = (kind: keyof typeof STEPPE_BOX, a: Pick<DetailArt<AlienPal>, 'body' | 'under' | 'over'>): DetailArt<AlienPal> =>
  ({ pal: STEPPE_PAL[kind], mono: alienMono, box: STEPPE_BOX[kind], ...a });

/** Six jointed legs from the thorax, two tripods swinging in turn. */
export function legs6(ctx: Ctx, p: AlienPal, t: number, hips: readonly number[], hipX: number, reach: number, speed: number, w: number): void {
  hips.forEach((y0, i) => {
    for (const s of [-1, 1]) {
      const swing = Math.sin(t * speed + i * 2.1 + (s > 0 ? Math.PI : 0)) * reach * 0.22;
      const kx = s * (hipX + reach * 0.55), ky = y0 - reach * 0.25 + swing * 0.4;
      const fx = s * (hipX + reach), fy = y0 + (i - 1) * reach * 0.35 + swing;
      limb(ctx, [s * hipX, y0, kx, ky, fx, fy], w, ink(p));
    }
  });
}

/** The trooper's domed helmet with its glowing visor and crest. */
export function helmet(ctx: Ctx, p: AlienPal, x: number, y: number, r: number): void {
  if (p.mono) {
    ctx.fillStyle = p.shell;
    ctx.beginPath();
    ctx.arc(x, y, r + 0.5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  shell(ctx, x, y, r, r, { ...ink(p), base: p.light, light: '#e6dcf2' }, 0);
  plateShell(ctx, [x - r * 0.75, y + r * 0.35, x + r * 0.75, y + r * 0.35, x + r * 0.5, y + r * 0.95, x - r * 0.5, y + r * 0.95], { base: p.glow, dark: '#7a1a6a', light: p.core, ink: p.ink }, 0.4);
  plate(ctx, x - 0.4, y - r * 0.9, 0.8, r * 1.1, p.trim, p.ink, 0.2); // crest
}

/** A plasma rifle along +y from (x, 0) in the hand, turned with the aim by the caller. */
export function rifle(ctx: Ctx, p: AlienPal, x: number, len: number): void {
  plateShell(ctx, [x - 1.2, -1.5, x + 1.2, -1.5, x + 1.5, len * 0.55, x - 1.5, len * 0.55], metalInk(p), 0.45);
  plateShell(ctx, [x - 0.7, len * 0.5, x + 0.7, len * 0.5, x + 0.55, len, x - 0.55, len], metalInk(p), 0.4);
  if (p.mono) return;
  plate(ctx, x - 0.6, len * 0.15, 1.2, len * 0.3, p.trim, p.ink, 0.2);
  glow(ctx, x, len + 0.4, 2.2, '255,74,216', 0.75);
}

