// Piano Bar (doc 23): hub / offer card icon within ±40 px — a little upright piano, keys rippling, a beer on
// the lid and notes floating up.

function note(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, color: string): void {
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, 3.6, 2.7, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 2.4, y - 11, 1.6, 11);
  ctx.fillRect(x + 2.4, y - 11, 5, 1.6);
  ctx.globalAlpha = 1;
}

export function drawPianoIcon(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.save();
  ctx.translate(0, 6);
  ctx.scale(0.85, 0.85);
  piano(ctx, t);
  ctx.restore();
  const colors = ['#ff5d5d', '#ffc83d', '#5fd4ff'] as const;
  for (let k = 0; k < 3; k++) {
    const ph = (t * 0.6 + k / 3) % 1;
    note(ctx, -22 + k * 14 + Math.sin(ph * 6 + k) * 3, -16 - ph * 14, 1 - ph, colors[k] ?? '#fff');
  }
}

function piano(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-30, 30, 64, 4);
  ctx.fillStyle = '#5a301d';
  ctx.fillRect(-32, -18, 64, 48);
  ctx.fillStyle = '#6e3e26';
  ctx.fillRect(-34, -22, 68, 6);
  ctx.fillStyle = '#47251a';
  ctx.fillRect(-26, -12, 52, 12);
  ctx.fillStyle = '#efe6cf';
  ctx.fillRect(-10, -11, 20, 10);
  ctx.fillStyle = '#efe7d3';
  ctx.fillRect(-30, 2, 60, 10);
  const lit = Math.floor(t * 6) % 10;
  for (let i = 0; i < 10; i++) {
    if (i === lit) {
      ctx.fillStyle = '#ffd76a';
      ctx.fillRect(-30 + i * 6, 2, 6, 10);
    }
    ctx.fillStyle = 'rgba(60,40,30,0.6)';
    ctx.fillRect(-30 + i * 6, 2, 0.8, 10);
    if (i % 7 !== 2 && i % 7 !== 6 && i < 9) {
      ctx.fillStyle = '#1b1210';
      ctx.fillRect(-26.5 + i * 6, 2, 3, 6);
    }
  }
  ctx.fillStyle = '#331a0f';
  ctx.fillRect(-30, 12, 60, 18);
  ctx.fillStyle = '#e3a33a';
  ctx.fillRect(20, -32, 8, 10);
  ctx.fillStyle = '#fbf6ea';
  ctx.fillRect(19, -35, 10, 4);
}
