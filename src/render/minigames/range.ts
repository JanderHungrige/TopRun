import { boardHalf, raised, SPOTS, type Board } from '../../game/minigames/range';

// FIRING RANGE's screen (doc 90): the jungle behind the range, two berms of sandbags the boards rise from, the boards
// themselves — a red walker silhouette, or a green board with a monkey's face — with their bullet holes, the crosshair,
// the mech's gun barrel at the bottom with its muzzle flash, and the hub icon.

type Ctx = CanvasRenderingContext2D;

export function drawRangeBack(ctx: Ctx, t: number): void {
  const g = ctx.createLinearGradient(0, 56, 0, 400);
  g.addColorStop(0, '#6a9a6a');
  g.addColorStop(1, '#c8d890');
  ctx.fillStyle = g;
  ctx.fillRect(0, 56, 1280, 664);
  for (let i = 0; i < 14; i++) {
    const x = i * 100 + 20;
    const h = 120 + ((i * 53) % 80);
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(x - 6, 330 - h, 12, h);
    ctx.fillStyle = i % 2 ? '#2e5a1e' : '#3e7a2a';
    ctx.beginPath();
    ctx.arc(x + Math.sin(t * 0.6 + i) * 2, 330 - h, 60, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#7a5a34';
  ctx.fillRect(0, 330, 1280, 390);
  ctx.fillStyle = '#6a4a2a';
  for (let i = 0; i < 30; i++) ctx.fillRect((i * 173) % 1280, 360 + ((i * 97) % 340), 40, 4);
}

/** A berm of sandbags in front of a row of boards (drawn after the boards behind it). */
export function drawBerm(ctx: Ctx, y: number, scale: number): void {
  for (let x = -20; x < 1300; x += 56 * scale) {
    ctx.fillStyle = '#5a4428';
    ctx.beginPath();
    ctx.ellipse(x, y, 30 * scale, 14 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b8945a';
    ctx.beginPath();
    ctx.ellipse(x, y - 2 * scale, 27 * scale, 11 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function walkerFace(ctx: Ctx, w: number, h: number): void {
  ctx.fillStyle = '#2a2018';
  ctx.fillRect(-w * 0.45, -h * 0.55, w * 0.9, h * 0.45);
  ctx.fillRect(-w * 0.4, -h * 0.1, w * 0.15, h * 0.55);
  ctx.fillRect(w * 0.25, -h * 0.1, w * 0.15, h * 0.55);
  ctx.fillRect(w * 0.45, -h * 0.4, w * 0.4, h * 0.12);
  ctx.fillStyle = '#ffd23a';
  ctx.fillRect(-w * 0.15, -h * 0.42, w * 0.3, h * 0.1);
}

function monkeyFace(ctx: Ctx, w: number, h: number): void {
  ctx.fillStyle = '#6a4024';
  ctx.beginPath();
  ctx.arc(0, -h * 0.1, w * 0.55, 0, Math.PI * 2);
  ctx.arc(-w * 0.62, -h * 0.2, w * 0.18, 0, Math.PI * 2);
  ctx.arc(w * 0.62, -h * 0.2, w * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e8c8a0';
  ctx.beginPath();
  ctx.ellipse(0, 0, w * 0.4, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1a1008';
  for (const sx of [-1, 1]) ctx.fillRect(sx * w * 0.16 - 3, -h * 0.12, 6, 6);
  ctx.fillRect(-w * 0.12, h * 0.12, w * 0.24, 3);
}

/** A board on its post, risen by its age; hit boards show the hole and fall. */
export function drawBoard(ctx: Ctx, b: Board, t: number): void {
  const k = raised(b, t);
  const spot = SPOTS[b.spot];
  if (!spot || k <= 0) return;
  const { w, h } = boardHalf(b.spot);
  const y = spot.y + (1 - k) * h * 2.2;
  ctx.save();
  ctx.translate(spot.x, y);
  ctx.fillStyle = '#5a3a1e';
  ctx.fillRect(-4, h, 8, h * 1.4);
  ctx.fillStyle = b.kind === 'foe' ? '#c8503a' : '#5ab84a';
  ctx.fillRect(-w, -h, w * 2, h * 2);
  ctx.strokeStyle = '#2a1a0e';
  ctx.lineWidth = 3;
  ctx.strokeRect(-w, -h, w * 2, h * 2);
  if (b.kind === 'foe') walkerFace(ctx, w, h);
  else monkeyFace(ctx, w, h);
  if (b.hit) {
    ctx.fillStyle = '#1a1008';
    ctx.beginPath();
    ctx.arc(w * 0.1, -h * 0.2, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawCrosshair(ctx: Ctx, x: number, y: number): void {
  ctx.strokeStyle = 'rgba(255,240,140,0.95)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.moveTo(x - 34, y);
  ctx.lineTo(x - 12, y);
  ctx.moveTo(x + 12, y);
  ctx.lineTo(x + 34, y);
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x, y - 12);
  ctx.moveTo(x, y + 12);
  ctx.lineTo(x, y + 34);
  ctx.stroke();
}

/** The mech's autocannon reaching in at the bottom right, pointing at the aim, flashing for `flash` s after a shot. */
export function drawGun(ctx: Ctx, aim: { x: number; y: number }, flash: number): void {
  const bx = 1040;
  const by = 760;
  const a = Math.atan2(aim.y - by, aim.x - bx);
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(a);
  ctx.fillStyle = '#2c3024';
  ctx.fillRect(0, -26, 260, 52);
  ctx.fillStyle = '#5a6048';
  ctx.fillRect(160, -14, 200, 28);
  ctx.fillStyle = '#4e6b2e';
  ctx.fillRect(0, -30, 120, 60);
  if (flash > 0) {
    ctx.fillStyle = `rgba(255,220,120,${Math.min(1, flash * 10).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(370, 0, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/** The hub card's icon: a walker board with a hole and a crosshair. */
export function drawRangeIcon(ctx: Ctx, t: number): void {
  ctx.fillStyle = '#c8503a';
  ctx.fillRect(-24, -30, 48, 54);
  ctx.save();
  ctx.translate(0, 0);
  walkerFace(ctx, 24, 28);
  ctx.restore();
  const k = Math.sin(t * 2) * 6;
  drawCrosshair(ctx, k, -4);
}
