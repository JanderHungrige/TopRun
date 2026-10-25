import type { AreaRect } from '../../data/base-areas';
import { hexOf, PAL, type Ramp } from '../pixel/palette';
import { ARCADE, BEACON, DOOR, HORIZON, LAMPS, LAMP_Y, MUG } from './layout';
import { col, hash } from './paint';
import { FAN_FRAMES, fanSprite, neonSprite, type Placed } from './sprites';

// Hangar base (doc 30): the living details, drawn every frame in whole art pixels on the art-resolution compose
// canvas — lamp bulbs (one flickers now and then), the red door beacon, clouds / a distant aircraft light / the
// approach-light "rabbit" outside, the wall fan, the neon sign's flicker and buzz, the arcade screen, dust motes
// in the light, steam from the coffee mug and the pulsing gold brackets around the highlighted area.

const hx = (ramp: Ramp, i: number): string => hexOf(col(ramp, i));

function px(g: CanvasRenderingContext2D, c: number, r: number, w: number, h: number, color: string): void {
  g.fillStyle = color;
  g.fillRect(c, r, w, h);
}

function blit(g: CanvasRenderingContext2D, s: Placed | null): void {
  if (s) g.drawImage(s.canvas, s.c, s.r);
}

function lamps(g: CanvasRenderingContext2D, G: number, t: number): void {
  LAMPS.forEach((x, i) => {
    const c = Math.round(x / G);
    const r = Math.round(LAMP_Y / G);
    const off = i === 1 && (hash(Math.floor(t * 14)) > 0.95 || (t % 11 > 6 && t % 11 < 6.25 && Math.floor(t * 24) % 2 === 0));
    if (off) return px(g, c - 2, r, 5, 1, hx(PAL.lamp, 1));
    px(g, c - 3, r, 7, 1, hx(PAL.lamp, 4));
    px(g, c - 1, r, 3, 1, hx(PAL.lamp, 5));
    px(g, c - 2, r + 1, 5, 1, hx(PAL.lamp, 3));
  });
}

function beacon(g: CanvasRenderingContext2D, G: number, t: number): void {
  if (t % 1.2 > 0.35) return;
  const c = Math.round(BEACON.x / G);
  const r = Math.round((BEACON.y - 3) / G);
  px(g, c - 2, r, 5, 1, hx(PAL.red, 3));
  px(g, c, r - 2, 1, 5, hx(PAL.red, 3));
  px(g, c - 1, r - 1, 3, 3, hx(PAL.red, 4));
  px(g, c, r, 1, 1, hx(PAL.red, 5));
}

function outside(g: CanvasRenderingContext2D, G: number, t: number): void {
  const c0 = Math.round(DOOR.x / G);
  const r0 = Math.round(DOOR.y / G);
  const w = Math.round(DOOR.w / G);
  const hz = Math.round(HORIZON / G);
  g.save();
  g.beginPath();
  g.rect(c0, r0, w, hz - r0);
  g.clip();
  for (let i = 0; i < 3; i++) {
    const x = c0 + Math.round(((t * (1.6 + i * 0.7) + i * 37) % (w + 30)) - 15);
    const y = r0 + 12 + i * 11;
    px(g, x, y, 14 - i * 2, 1, hx(PAL.dusk, 3 + (i % 2)));
    px(g, x + 3, y - 1, 6, 1, hx(PAL.dusk, 4 + (i % 2)));
  }
  const ax = c0 + Math.round(((t * 2.2) % (w + 20)) - 10);
  const ay = r0 + 22 + Math.round(Math.sin(t * 0.3) * 2);
  px(g, ax, ay, 1, 1, hx(PAL.red, 3));
  if (t % 1.1 < 0.12) px(g, ax + 1, ay, 1, 1, hx(PAL.white, 4));
  g.restore();
  const step = Math.floor(t * 12) % 9;
  if (step < 6) px(g, c0 + w - 4 - step * 6, Math.round((HORIZON + 12) / G), 2, 1, hx(PAL.white, 4));
}

function fan(g: CanvasRenderingContext2D, G: number, t: number): void {
  blit(g, fanSprite(G, Math.floor(t * 14) % FAN_FRAMES));
}

function neon(g: CanvasRenderingContext2D, G: number, t: number): void {
  const burst = t % 9.3 > 4.1 && t % 9.3 < 4.45 && Math.floor(t * 30) % 2 === 0;
  if (burst || hash(Math.floor(t * 20) + 7) > 0.965) return;
  blit(g, neonSprite(G, Math.floor(t * 8) % 11 === 3));
}

function arcade(g: CanvasRenderingContext2D, G: number, t: number): void {
  const c = Math.round((ARCADE.x + 4) / G);
  const r = Math.round((ARCADE.y + 16) / G);
  const w = Math.max(4, Math.round((ARCADE.w - 14) / G));
  const f = Math.floor(t * 4) % 4;
  for (let i = 0; i < 3; i++) px(g, c + 1 + i * 2 + (f % 2), r + 1, 1, 1, hx(PAL.green, 4));
  px(g, c + 1 + ((f + 1) % 2), r + 3, 1, 1, hx(PAL.red, 4));
  px(g, c + Math.floor(w / 2) - 1 + (f < 2 ? 0 : 1), r + 7, 3, 1, hx(PAL.yellow, 4));
  px(g, c + Math.floor(w / 2), r + 6 - f, 1, 1, hx(PAL.white, 4));
}

/** A mote's home: one of the lamp cones, or the air in the door's sun shaft. */
function motePos(i: number, t: number, G: number): { c: number; r: number } {
  const k = i % 4;
  const y = 150 + hash(i * 3.1) * 320 + Math.sin(t * 0.35 + i) * 8;
  if (k < 3) {
    const half = 13 + ((y - LAMP_Y) * 100) / 383;
    const x = (LAMPS[k] ?? 0) + (hash(i * 7.3) * 2 - 1) * half + Math.sin(t * 0.22 + i * 1.7) * 9;
    return { c: Math.round(x / G), r: Math.round(y / G) };
  }
  const x = DOOR.x - 200 + hash(i * 5.7) * (DOOR.w + 190) + Math.sin(t * 0.18 + i) * 10;
  return { c: Math.round(x / G), r: Math.round((340 + hash(i * 2.3) * 230 + Math.sin(t * 0.3 + i * 2) * 6) / G) };
}

function dust(g: CanvasRenderingContext2D, G: number, t: number): void {
  for (let i = 0; i < 44; i++) {
    const tw = Math.sin(t * (0.8 + hash(i) * 1.6) + i * 5);
    if (tw < 0.15) continue;
    const { c, r } = motePos(i, t, G);
    px(g, c, r, 1, 1, i % 4 === 3 ? hx(PAL.dusk, tw > 0.65 ? 7 : 6) : hx(PAL.lamp, tw > 0.65 ? 5 : 3));
  }
}

function steam(g: CanvasRenderingContext2D, G: number, t: number): void {
  for (let i = 0; i < 3; i++) {
    const life = (t * 0.45 + i / 3) % 1;
    const x = (MUG.x + 5 + Math.sin(life * 7 + i * 2) * 4) / G;
    const y = (MUG.y - 2 - life * 34) / G;
    g.globalAlpha = 0.7 * (1 - life);
    px(g, Math.round(x), Math.round(y), 1, life > 0.5 ? 1 : 2, hx(PAL.white, 2));
  }
  g.globalAlpha = 1;
}

/** Pulsing gold corner brackets around a hotspot (logical rect). */
export function drawBrackets(g: CanvasRenderingContext2D, G: number, rect: AreaRect, t: number): void {
  const o = Math.floor(t * 4) % 2;
  const c0 = Math.round(rect.x / G) - 1 - o;
  const r0 = Math.round(rect.y / G) - 1 - o;
  const c1 = Math.min(Math.floor(1280 / G) - 2, Math.round((rect.x + rect.w) / G) + o);
  const r1 = Math.min(Math.floor(720 / G) - 2, Math.round((rect.y + rect.h) / G) + o);
  const arm = 5;
  const gold = hx(PAL.gold, o ? 5 : 4);
  for (const [color, d] of [[hx(PAL.ink, 0), 1], [gold, 0]] as const) {
    for (const [cx, cy, sx, sy] of [[c0, r0, 1, 1], [c1, r0, -1, 1], [c0, r1, 1, -1], [c1, r1, -1, -1]] as const) {
      px(g, Math.min(cx, cx + sx * (arm - 1)) + d, cy + d, arm, 1, color);
      px(g, cx + d, Math.min(cy, cy + sy * (arm - 1)) + d, 1, arm, color);
    }
  }
}

/** Behind the jet: lamps, beacon, outside, fan, neon, arcade. */
export function drawAmbientBack(g: CanvasRenderingContext2D, G: number, t: number): void {
  lamps(g, G, t);
  beacon(g, G, t);
  outside(g, G, t);
  fan(g, G, t);
  neon(g, G, t);
  arcade(g, G, t);
}

/** In front of the jet and the props: dust in the light, mug steam. */
export function drawAmbientFront(g: CanvasRenderingContext2D, G: number, t: number): void {
  dust(g, G, t);
  steam(g, G, t);
}
