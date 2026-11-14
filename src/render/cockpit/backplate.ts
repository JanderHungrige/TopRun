import { rnd } from './metal';
import { SK } from './skin';

// The whole console behind the instruments, in the current skin (docs 05, 61, 67): gunmetal with brushed streaks and
// scratches (jets), olive drab worn to bare metal with rivet rows (helicopters), dark glass with a faint grid
// (spacecraft), teal enamel with brass rivets and rippled light (subs); a seam towards the playfield.

type Ctx = CanvasRenderingContext2D;

function streaks(ctx: Ctx, x: number, seed: number, strength: number): void {
  for (let i = 0; i < 160; i++) {
    ctx.fillStyle = `rgba(${SK.streak},${((0.012 + rnd(seed + i * 3) * 0.03) * strength).toFixed(3)})`;
    ctx.fillRect(x, rnd(seed + i) * 720, 320, 0.5);
  }
}

function scratches(ctx: Ctx, x: number, seed: number, n: number): void {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const sx = x + rnd(seed * 7 + i) * 320;
    const sy = rnd(seed * 11 + i) * 720;
    const a = rnd(seed * 13 + i) * Math.PI;
    const l = 5 + rnd(seed * 17 + i) * 24;
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l);
  }
  ctx.strokeStyle = SK.scratch;
  ctx.lineWidth = 0.6;
  ctx.stroke();
}

/** Olive drab: chips of bare metal where the paint wore off, rivet rows down both edges and across. */
function worn(ctx: Ctx, x: number, seed: number): void {
  for (let i = 0; i < 46; i++) {
    const cx = x + rnd(seed * 3 + i) * 320;
    const cy = rnd(seed * 5 + i) * 720;
    const r = 1.2 + rnd(seed * 19 + i) * 3.5;
    ctx.fillStyle = 'rgba(160,160,140,0.22)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.6, r, rnd(seed + i) * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
  rivetRows(ctx, x);
}

/** Rivet rows down both edges and across, in the skin's metal. */
function rivetRows(ctx: Ctx, x: number): void {
  const rivet = (rx: number, ry: number): void => {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.arc(rx + 0.5, ry + 0.7, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = SK.metal[2];
    ctx.beginPath();
    ctx.arc(rx, ry, 1.6, 0, Math.PI * 2);
    ctx.fill();
  };
  for (let y = 8; y < 720; y += 16) {
    rivet(x + 5, y);
    rivet(x + 315, y);
  }
  for (const y of [62, 326, 458, 600]) for (let rx = x + 22; rx < x + 300; rx += 18) rivet(rx, y);
}

/** Teal enamel: soft bands of rippled light, as through water, and brass rivet rows. */
function ripples(ctx: Ctx, x: number, seed: number): void {
  ctx.lineWidth = 3;
  for (let i = 0; i < 26; i++) {
    const y0 = rnd(seed * 31 + i) * 720;
    const amp = 2 + rnd(seed * 37 + i) * 4;
    ctx.strokeStyle = `rgba(${SK.streak},${(0.02 + rnd(seed * 41 + i) * 0.04).toFixed(3)})`;
    ctx.beginPath();
    for (let k = 0; k <= 32; k++) {
      const px = x + k * 10;
      const py = y0 + Math.sin(k * 0.7 + i) * amp;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  rivetRows(ctx, x);
}

/** Glass: a faint grid and a few brighter traces. */
function grid(ctx: Ctx, x: number, seed: number): void {
  ctx.strokeStyle = `rgba(${SK.edgeGlow ?? SK.streak},0.05)`;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (let gx = x + 8; gx < x + 320; gx += 24) {
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, 720);
  }
  for (let gy = 8; gy < 720; gy += 24) {
    ctx.moveTo(x, gy);
    ctx.lineTo(x + 320, gy);
  }
  ctx.stroke();
  ctx.strokeStyle = `rgba(${SK.edgeGlow ?? SK.streak},0.14)`;
  ctx.beginPath();
  for (let i = 0; i < 9; i++) {
    const y = rnd(seed * 23 + i) * 720;
    const x0 = x + rnd(seed * 29 + i) * 200;
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 + 40 + rnd(seed + i) * 80, y);
    ctx.lineTo(x0 + 52 + rnd(seed + i) * 80, y + 12);
  }
  ctx.stroke();
}

/** The mech's hazard stripes along the console's foot (doc 80). */
/** The tanks (doc 104): a strip of track links along the bottom edge, dust in the corners. */
function treads(ctx: Ctx, x: number): void {
  ctx.fillStyle = '#2a251a';
  ctx.fillRect(x, 698, 320, 22);
  for (let k = 0; k < 20; k++) {
    ctx.fillStyle = '#5c5440';
    ctx.fillRect(x + k * 16 + 2, 701, 12, 16);
    ctx.fillStyle = '#857a5c';
    ctx.fillRect(x + k * 16 + 4, 703, 8, 3);
  }
  const g = ctx.createLinearGradient(x, 560, x, 700);
  g.addColorStop(0, 'rgba(200,170,110,0)');
  g.addColorStop(1, 'rgba(200,170,110,0.16)');
  ctx.fillStyle = g;
  ctx.fillRect(x, 560, 320, 140);
}

function hazard(ctx: Ctx, x: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, 700, 320, 20);
  ctx.clip();
  for (let k = -1; k < 18; k++) {
    ctx.fillStyle = k % 2 ? '#1a1608' : '#d8b830';
    ctx.beginPath();
    ctx.moveTo(x + k * 20, 720);
    ctx.lineTo(x + k * 20 + 20, 700);
    ctx.lineTo(x + k * 20 + 40, 700);
    ctx.lineTo(x + k * 20 + 20, 720);
    ctx.fill();
  }
  ctx.restore();
}

export function backplate(ctx: Ctx, x: number, seed: number, seamX: number): void {
  const g = ctx.createLinearGradient(x, 0, x + 320, 720);
  g.addColorStop(0, SK.back[0]);
  g.addColorStop(0.55, SK.back[1]);
  g.addColorStop(1, SK.back[2]);
  ctx.fillStyle = g;
  ctx.fillRect(x, 0, 320, 720);
  switch (SK.id) {
    case 'jet':
      streaks(ctx, x, seed, 1);
      scratches(ctx, x, seed, 34);
      break;
    case 'heli':
      streaks(ctx, x, seed, 0.6);
      scratches(ctx, x, seed, 48);
      worn(ctx, x, seed);
      break;
    case 'ship':
      grid(ctx, x, seed);
      break;
    case 'sub':
      ripples(ctx, x, seed);
      break;
    case 'mech':
      worn(ctx, x, seed);
      hazard(ctx, x);
      break;
    case 'tank':
      streaks(ctx, x, seed, 0.5);
      worn(ctx, x, seed);
      treads(ctx, x);
      break;
    default:
      throw new Error(`unhandled: ${SK.id satisfies never}`);
  }
  ctx.fillStyle = SK.seam;
  ctx.fillRect(seamX - 2, 0, 4, 720);
  ctx.fillStyle = SK.seamHi;
  ctx.fillRect(seamX + (seamX > x + 160 ? -3 : 2), 0, 1, 720);
}
