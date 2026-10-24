import { TAU } from '../core/math';
import type { TerrainStyle, TheaterPalette } from '../data/theaters';
import { fillPoly } from './shapes';
import { text } from './text';

/** Side-view carrier world. World x runs along the deck (catapult start = 0); screen y is absolute. */
export const DECK_Y = 430;
export const SEA_Y = 520;
export const CARRIER_STERN = -1100;
export const CARRIER_BOW = 620;

const SKY: Readonly<Record<TerrainStyle, readonly [string, string, string]>> = {
  ocean: ['#3d7fc4', '#8cc0e6', '#f3dcb4'],
  desert: ['#4a86c0', '#a9c8e0', '#f5c98e'],
  ice: ['#6f93b8', '#c4d6e6', '#eef3f7'],
  canyon: ['#3f6fa8', '#d9a07a', '#f7b46a'],
  storm: ['#26323f', '#4b5a68', '#77818a'],
};

export function drawSky(ctx: CanvasRenderingContext2D, style: TerrainStyle, camX: number, t: number): void {
  const [top, mid, horizon] = SKY[style];
  const g = ctx.createLinearGradient(0, 0, 0, SEA_Y);
  g.addColorStop(0, top);
  g.addColorStop(0.6, mid);
  g.addColorStop(1, horizon);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1280, SEA_Y);
  const sun = ctx.createRadialGradient(1040, 150, 10, 1040, 150, 220);
  sun.addColorStop(0, 'rgba(255,250,220,0.95)');
  sun.addColorStop(0.15, 'rgba(255,236,180,0.6)');
  sun.addColorStop(1, 'rgba(255,236,180,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(700, 0, 580, SEA_Y);
  ctx.fillStyle = style === 'storm' ? 'rgba(90,100,112,0.8)' : 'rgba(255,255,255,0.75)';
  for (let i = 0; i < 7; i++) {
    const x = ((i * 380 - camX * 0.15 - t * 6) % 1700 + 1700) % 1700 - 200;
    const y = 80 + (i % 3) * 70;
    for (let k = 0; k < 5; k++) {
      ctx.beginPath();
      ctx.arc(x + k * 34, y + Math.sin(k * 2 + i) * 10, 26 + ((k + i) % 3) * 8, 0, TAU);
      ctx.fill();
    }
  }
  // Distant escort ship on the horizon.
  const ex = ((900 - camX * 0.08) % 1600 + 1600) % 1600 - 160;
  fillPoly(ctx, [ex, SEA_Y - 4, ex + 120, SEA_Y - 4, ex + 110, SEA_Y + 2, ex + 8, SEA_Y + 2], 'rgba(70,85,100,0.7)');
  fillPoly(ctx, [ex + 40, SEA_Y - 4, ex + 46, SEA_Y - 16, ex + 64, SEA_Y - 16, ex + 70, SEA_Y - 4], 'rgba(70,85,100,0.7)');
}

export function drawSea(ctx: CanvasRenderingContext2D, p: TheaterPalette, camX: number, t: number): void {
  const g = ctx.createLinearGradient(0, SEA_Y, 0, 720);
  g.addColorStop(0, p.sea);
  g.addColorStop(1, p.seaDeep);
  ctx.fillStyle = g;
  ctx.fillRect(0, SEA_Y, 1280, 720 - SEA_Y);
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 2;
  for (let row = 0; row < 7; row++) {
    const y = SEA_Y + 12 + row * row * 5 + row * 6;
    const speed = 0.4 + row * 0.12;
    ctx.beginPath();
    for (let i = 0; i < 18; i++) {
      const x = ((i * 90 + row * 37 - camX * speed + Math.sin(t + row) * 10) % 1400 + 1400) % 1400 - 60;
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + 14, y - 3, x + 28 + row * 3, y);
    }
    ctx.stroke();
  }
}

function drawIsland(ctx: CanvasRenderingContext2D, sx: number, t: number): void {
  const x = sx;
  fillPoly(ctx, [x, DECK_Y, x + 10, DECK_Y - 70, x + 150, DECK_Y - 70, x + 170, DECK_Y], '#7c8792', 'rgba(0,0,0,0.3)');
  fillPoly(ctx, [x + 30, DECK_Y - 70, x + 40, DECK_Y - 130, x + 120, DECK_Y - 130, x + 130, DECK_Y - 70], '#8a95a0', 'rgba(0,0,0,0.3)');
  ctx.fillStyle = '#1d2a36';
  for (let i = 0; i < 6; i++) ctx.fillRect(x + 22 + i * 22, DECK_Y - 58, 14, 8);
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 50 + i * 18, DECK_Y - 118, 12, 7);
  ctx.strokeStyle = '#4b5560';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x + 80, DECK_Y - 130);
  ctx.lineTo(x + 80, DECK_Y - 200);
  ctx.moveTo(x + 64, DECK_Y - 175);
  ctx.lineTo(x + 96, DECK_Y - 175);
  ctx.stroke();
  const w = Math.cos(t * 2.4) * 18;
  fillPoly(ctx, [x + 80 - w, DECK_Y - 196, x + 80 + w, DECK_Y - 196, x + 80 + w * 0.8, DECK_Y - 188, x + 80 - w * 0.8, DECK_Y - 188], '#c9d1d8');
  text(ctx, '75', x + 140, DECK_Y - 82, { size: 30, display: true, color: '#f2f2f2', align: 'center' });
}

function drawDeckCrew(ctx: CanvasRenderingContext2D, x: number, color: string, pose: number): void {
  ctx.fillStyle = color;
  ctx.fillRect(x - 3, DECK_Y - 15, 6, 9);
  ctx.fillStyle = '#2b2b2b';
  ctx.fillRect(x - 3, DECK_Y - 6, 2, 6);
  ctx.fillRect(x + 1, DECK_Y - 6, 2, 6);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, DECK_Y - 18, 3.5, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, DECK_Y - 13);
  ctx.lineTo(x + 9 * Math.cos(-pose), DECK_Y - 13 + 9 * Math.sin(-pose));
  ctx.stroke();
}

export interface CarrierView {
  camX: number;
  t: number;
  jbd: number; // jet blast deflector raise 0..1
  shooterPose: number; // radians of the launch officer's arm
  launched: boolean;
}

export function drawCarrier(ctx: CanvasRenderingContext2D, v: CarrierView): void {
  const sx = (wx: number): number => wx - v.camX;
  // Hull with flared bow and overhanging flight deck.
  fillPoly(ctx, [sx(CARRIER_STERN), DECK_Y, sx(CARRIER_BOW), DECK_Y, sx(CARRIER_BOW - 60), SEA_Y + 6, sx(CARRIER_STERN + 40), SEA_Y + 6], '#5d6873', 'rgba(0,0,0,0.35)');
  ctx.fillStyle = '#4c5660';
  ctx.fillRect(sx(CARRIER_STERN + 30), DECK_Y + 18, CARRIER_BOW - CARRIER_STERN - 120, 6);
  ctx.fillStyle = '#7a3a2e';
  ctx.fillRect(sx(CARRIER_STERN + 40), SEA_Y - 6, CARRIER_BOW - CARRIER_STERN - 100, 12);
  ctx.fillStyle = '#3b444d';
  ctx.fillRect(sx(CARRIER_STERN), DECK_Y - 6, CARRIER_BOW - CARRIER_STERN, 8);
  // Deck markings and catapult track.
  ctx.strokeStyle = '#e8e8e8';
  ctx.setLineDash([18, 14]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx(CARRIER_STERN + 20), DECK_Y - 6);
  ctx.lineTo(sx(CARRIER_BOW - 10), DECK_Y - 6);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(sx(-10), DECK_Y - 7, 580, 2);
  drawIsland(ctx, sx(-480), v.t);
  // Jet blast deflector behind the catapult.
  const jbdX = sx(-95);
  const h = 34 * v.jbd;
  if (h > 1) fillPoly(ctx, [jbdX, DECK_Y - 6, jbdX + 8, DECK_Y - 6 - h, jbdX + 14, DECK_Y - 6 - h, jbdX + 6, DECK_Y - 6], '#9aa3ab', 'rgba(0,0,0,0.4)');
  drawDeckCrew(ctx, sx(120), '#ffd23f', v.shooterPose);
  drawDeckCrew(ctx, sx(-150), '#4bd16b', 0.4);
  drawDeckCrew(ctx, sx(-175), '#4bd16b', 2.6);
  drawDeckCrew(ctx, sx(-250), '#d94a4a', 1.2);
  // Bow wave and wake.
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 6; i++) {
    const wx = sx(CARRIER_BOW - 70 + Math.sin(v.t * 3 + i) * 8 + i * 6);
    ctx.beginPath();
    ctx.arc(wx, SEA_Y + 4 + i, 6 + (i % 3) * 2, 0, TAU);
    ctx.fill();
  }
}
