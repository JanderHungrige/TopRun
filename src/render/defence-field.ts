import { OUTPOST_Y, type Lane } from '../game/defence-layout';
import type { Defence } from '../scenes/mission/defence-mission';
import { circle, ellipse } from './shapes';
import { drawTower } from './tower-art';

// The field of a defence (doc 106), drawn over the steppe's floor: the lanes as trodden dirt paths with ruts, the
// concrete build pads, the outpost along the bottom — sandbag wall with a gate per lane, tents, crates and a radio
// mast — then the towers on their pads and their shots: flak tracers, tesla zaps, mortar shells in flight, the jammer's
// pulse.

type Ctx = CanvasRenderingContext2D;
const W = 640;

function path(ctx: Ctx, l: Lane): void {
  ctx.beginPath();
  l.points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
}

function lanes(ctx: Ctx, d: Defence): void {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const l of d.layout.lanes) {
    path(ctx, l);
    ctx.strokeStyle = 'rgba(70,45,20,0.35)';
    ctx.lineWidth = 42;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150,110,60,0.55)';
    ctx.lineWidth = 34;
    ctx.stroke();
    ctx.setLineDash([10, 9]);
    ctx.strokeStyle = 'rgba(70,45,20,0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function pads(ctx: Ctx, d: Defence, near: number): void {
  d.layout.pads.forEach((p, i) => {
    circle(ctx, p.x + 3, p.y + 4, 22, 'rgba(0,0,0,0.25)');
    circle(ctx, p.x, p.y, 22, '#4a473e');
    circle(ctx, p.x, p.y, 20, '#8a8678');
    circle(ctx, p.x - 5, p.y - 5, 9, 'rgba(255,255,255,0.12)');
    for (let k = 0; k < 4; k++) circle(ctx, p.x + Math.cos(k * 1.57 + 0.78) * 15, p.y + Math.sin(k * 1.57 + 0.78) * 15, 1.4, '#3a3830');
    if (i === near || i === d.menuPad) {
      ctx.strokeStyle = '#ffd25a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 25, 0, Math.PI * 2);
      ctx.stroke();
    }
  });
}

function outpost(ctx: Ctx, d: Defence, t: number): void {
  const y = OUTPOST_Y;
  ctx.fillStyle = '#a89068';
  ctx.fillRect(0, y + 14, W, 720 - y);
  for (const [x, w] of [[40, 70], [150, 60], [470, 80], [570, 50]] as const) { // tents from above
    ctx.fillStyle = '#7a6a44';
    ctx.fillRect(x, y + 40, w, 40);
    ctx.fillStyle = '#8f7e52';
    ctx.fillRect(x, y + 40, w, 18);
    ctx.fillStyle = '#5a4c30';
    ctx.fillRect(x, y + 58, w, 2);
  }
  for (const [x, yy] of [[250, 40], [268, 52], [380, 46], [395, 60]] as const) { // crates
    ctx.fillStyle = '#5a4a2a';
    ctx.fillRect(x, y + yy, 14, 12);
    ctx.fillStyle = '#7a6438';
    ctx.fillRect(x + 1, y + yy + 1, 12, 4);
  }
  circle(ctx, 330, y + 70, 6, '#3a3a34'); // the radio mast
  circle(ctx, 330, y + 70, 2.4, Math.floor(t * 2) % 2 ? '#ff4a3a' : '#5a2a22');
  const gates = d.layout.lanes.map((l) => l.gateX);
  for (let x = 6; x < W; x += 12) { // the sandbag wall, open at the gates
    if (gates.some((g) => Math.abs(x - g) < 26)) continue;
    ellipse(ctx, x, y + 8, 7, 5, '#2a2014');
    ellipse(ctx, x, y + 7, 6, 4, x % 24 ? '#c4ae7e' : '#b09a6a');
  }
  for (const g of gates) { // gate posts
    ctx.fillStyle = '#4a3a24';
    ctx.fillRect(g - 30, y - 4, 6, 22);
    ctx.fillRect(g + 24, y - 4, 6, 22);
  }
}

function fx(ctx: Ctx, d: Defence): void {
  for (const f of d.fx) {
    switch (f.kind) {
      case 'flak':
        ctx.strokeStyle = 'rgba(255,230,150,0.8)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(f.x0, f.y0);
        ctx.lineTo(f.x1, f.y1);
        ctx.stroke();
        break;
      case 'zap':
        ctx.strokeStyle = 'rgba(150,220,255,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(f.x0, f.y0);
        for (let k = 1; k < 5; k++) ctx.lineTo(f.x0 + ((f.x1 - f.x0) * k) / 5 + (Math.random() - 0.5) * 8, f.y0 + ((f.y1 - f.y0) * k) / 5 + (Math.random() - 0.5) * 8);
        ctx.lineTo(f.x1, f.y1);
        ctx.stroke();
        break;
      case 'shell': {
        const u = 1 - f.t / 0.8;
        const x = f.x0 + (f.x1 - f.x0) * u;
        const y = f.y0 + (f.y1 - f.y0) * u - Math.sin(u * Math.PI) * 60;
        circle(ctx, x, y, 3.2, '#2a2a24');
        break;
      }
      case 'pulse':
        ctx.strokeStyle = `rgba(255,90,70,${(f.t * 0.6).toFixed(2)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(f.x0, f.y0, 30 + (0.6 - f.t) * 200, 0, Math.PI * 2);
        ctx.stroke();
        break;
      default:
        throw new Error(`unhandled: ${f.kind satisfies never}`);
    }
  }
}

/** Under the units: lanes, pads, the outpost. `near`: the pad the vehicle stands on (−1 for none). */
export function drawDefenceGround(ctx: Ctx, d: Defence, near: number, t: number): void {
  lanes(ctx, d);
  pads(ctx, d, near);
  outpost(ctx, d, t);
}

/** Over the ground units: the towers and their shots. */
export function drawTowers(ctx: Ctx, d: Defence, t: number): void {
  for (const tw of d.towers) if (tw) drawTower(ctx, tw.id, tw.x, tw.y, { aim: tw.aim, level: tw.level, heat: tw.heat, t });
  fx(ctx, d);
}
