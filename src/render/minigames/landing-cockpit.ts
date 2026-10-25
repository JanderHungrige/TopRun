import { HUD_BOX } from './landing-hud';

// Carrier Landing cockpit at night (doc 18): canopy bow against the stars, the HUD combiner glass on its posts,
// the glareshield with the dim glow of the displays below it.

export const GLARE_TOP = 560;

function drawBow(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  ctx.lineCap = 'round';
  for (const [w, color] of [[22, '#05070a'], [3, '#1b232c']] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.moveTo(-14, 600);
    ctx.quadraticCurveTo(70, 104, 640, 50);
    ctx.quadraticCurveTo(1210, 104, 1294, 600);
    ctx.stroke();
  }
  // faint reflections on the glass
  ctx.strokeStyle = 'rgba(150,180,220,0.014)';
  ctx.lineWidth = 46;
  ctx.beginPath();
  ctx.moveTo(250, 560);
  ctx.lineTo(420, 120);
  ctx.moveTo(1030, 560);
  ctx.lineTo(1130, 300);
  ctx.stroke();
  ctx.restore();
}

function drawCombiner(ctx: CanvasRenderingContext2D): void {
  const { x, y, w, h } = HUD_BOX;
  ctx.save();
  ctx.fillStyle = 'rgba(120,200,170,0.035)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(140,170,190,0.16)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = '#07090c';
  ctx.fillRect(x - 5, y + h - 2, 8, GLARE_TOP - y - h + 30);
  ctx.fillRect(x + w - 3, y + h - 2, 8, GLARE_TOP - y - h + 30);
  ctx.restore();
}

function drawGlareshield(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(0, 720);
  ctx.lineTo(0, GLARE_TOP + 46);
  ctx.quadraticCurveTo(640, GLARE_TOP - 36, 1280, GLARE_TOP + 46);
  ctx.lineTo(1280, 720);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, GLARE_TOP - 20, 0, 720);
  g.addColorStop(0, '#11161c');
  g.addColorStop(0.25, '#07090c');
  g.addColorStop(1, '#030405');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,140,160,0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GLARE_TOP + 46);
  ctx.quadraticCurveTo(640, GLARE_TOP - 36, 1280, GLARE_TOP + 46);
  ctx.stroke();
  // up-front controller and the tops of the displays, dimmed for night
  ctx.fillStyle = 'rgba(80,200,120,0.07)';
  ctx.fillRect(560, GLARE_TOP + 40, 160, 44);
  ctx.fillStyle = 'rgba(80,200,120,0.18)';
  for (let i = 0; i < 4; i++) ctx.fillRect(576 + i * 36, GLARE_TOP + 52, 24, 3);
  for (const x of [300, 860]) {
    ctx.fillStyle = 'rgba(70,170,110,0.06)';
    ctx.fillRect(x, GLARE_TOP + 92, 120, 70);
    ctx.fillStyle = 'rgba(255,170,60,0.12)';
    ctx.fillRect(x + 12, GLARE_TOP + 104, 40, 2);
  }
}

/** Canopy, HUD glass and glareshield, drawn over the outside view. */
export function drawCockpit(ctx: CanvasRenderingContext2D): void {
  drawBow(ctx);
  drawCombiner(ctx);
  drawGlareshield(ctx);
}
