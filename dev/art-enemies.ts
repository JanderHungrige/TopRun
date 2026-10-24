// Dev-only enemy + boss art preview: http://localhost:5173/dev/art-enemies.html (not part of the production build).
import { BOSSES } from '../src/data/bosses';
import { ENEMIES, isAir, SEA_KINDS } from '../src/data/enemies';
import type { BossId, EnemyKind } from '../src/data/types';
import { drawBoss, type BossPartView } from '../src/render/draw-bosses';
import { drawEnemy, drawWreck } from '../src/render/draw-enemies';

const W = 1400;
const H = 900;
const canvas = document.getElementById('c') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const dpr = window.devicePixelRatio || 1;
canvas.width = W * dpr;
canvas.height = H * dpr;
canvas.style.width = `${W}px`;
canvas.style.height = `${H}px`;

const KINDS = Object.keys(ENEMIES) as EnemyKind[];
const BOSS_IDS = Object.keys(BOSSES) as BossId[];
let mouse: { x: number; y: number } | null = null;
let showHit = true;
canvas.addEventListener('mousemove', (e) => {
  const r = canvas.getBoundingClientRect();
  mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
});
window.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() === 'h') showHit = !showHit;
});

function target(t: number): { x: number; y: number } {
  return mouse ?? { x: W / 2 + Math.cos(t * 0.7) * 520, y: H / 2 + Math.sin(t * 0.9) * 400 };
}
function aimAt(x: number, y: number, t: number): number {
  const p = target(t);
  return Math.atan2(p.x - x, -(p.y - y));
}
function label(text: string, x: number, y: number): void {
  ctx.fillStyle = '#e8f0f8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
}

type Mode = 'normal' | 'flash' | 'turn' | 'wreck';

function drawUnit(k: EnemyKind, x: number, y: number, scale: number, mode: Mode, t: number, i: number): void {
  const heading = mode === 'turn' ? t * 0.6 : 0;
  const bank = mode === 'turn' ? Math.sin(t * 1.5) : 0;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (!isAir(k) && !SEA_KINDS.includes(k)) {
    ctx.fillStyle = '#a38f62';
    ctx.fillRect(-46, -46, 92, 92);
  }
  if (mode === 'wreck') {
    ctx.translate(-i * 37, 0);
    drawWreck(ctx, k, i * 37, 0, t);
  }
  else {
    if (isAir(k)) drawEnemy(ctx, k, 10, 16, { t, shadow: true, heading, bank });
    drawEnemy(ctx, k, 0, 0, { t: t + i * 0.37, flash: mode === 'flash', heading, bank, aim: aimAt(x, y, t) });
  }
  ctx.restore();
}

function unitsView(t: number): void {
  const rows: readonly Mode[] = ['normal', 'flash', 'turn', 'wreck'];
  rows.forEach((mode, r) => {
    const y = 95 + r * 205;
    label(mode, 22, y - 70);
    KINDS.forEach((k, i) => {
      drawUnit(k, 70 + i * 104, y, 1, mode, t, i);
      if (r === 0) label(k, 70 + i * 104, 22);
    });
  });
}

function zoomView(t: number): void {
  KINDS.filter(isAir).forEach((k, i) => drawUnit(k, 130 + i * 228, 190, 2.5, 'normal', t, i));
  KINDS.filter((k) => !isAir(k)).forEach((k, i) => drawUnit(k, 110 + i * 196, 610, 2.5, 'normal', t, i));
}

function overlay(id: BossId, x: number, y: number): void {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,255,255,0.75)';
  for (const h of BOSSES[id].hitboxes) {
    ctx.beginPath();
    ctx.arc(x + h.dx, y + h.dy, h.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(255,230,0,0.95)';
  for (const p of BOSSES[id].parts) {
    ctx.beginPath();
    ctx.arc(x + p.dx, y + p.dy, p.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function bossView(id: BossId, t: number): void {
  const def = BOSSES[id];
  const variants = [
    { name: 'all parts alive', damage: 0, enraged: false, dead: (_i: number) => false, flash: false },
    { name: 'parts lost, 50 % damage, hit flashes', damage: 0.5, enraged: false, dead: (i: number) => i === 1 || i === def.parts.length - 1, flash: t % 1.2 < 0.08 },
    { name: 'enraged, 90 % damage', damage: 0.9, enraged: true, dead: (i: number) => i >= 2, flash: false },
  ];
  variants.forEach((v, c) => {
    const x = 240 + c * 460;
    const y = 470;
    const parts: BossPartView[] = def.parts.map((p, i) => ({
      id: p.id, alive: !v.dead(i), aim: aimAt(x + p.dx, y + p.dy, t), flash: c === 1 && i === 0 && t % 0.6 < 0.06,
    }));
    drawBoss(ctx, id, x, y, { t, flash: v.flash, parts, damage: v.damage, enraged: v.enraged });
    if (c === 0 && showHit) overlay(id, x, y);
    label(`${def.name} — ${v.name}`, x, 24);
  });
}

// Optional inspection zoom: ?z=3&x=100&y=50 (x/y = top-left corner of the view in logical px).
const q = new URLSearchParams(location.search);
const zoom = Number(q.get('z') ?? 1);
const panX = Number(q.get('x') ?? 0);
const panY = Number(q.get('y') ?? 0);

let t = Number(q.get('t') ?? 0); // ?t=2.5 starts the clock there (background tabs do not tick)
function frame(): void {
  t += 1 / 60;
  ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, -panX * dpr * zoom, -panY * dpr * zoom);
  ctx.fillStyle = '#1d6596';
  ctx.fillRect(0, 0, W, H);
  const view = location.hash.slice(1) || 'units';
  if (view === 'zoom') zoomView(t);
  else if ((BOSS_IDS as readonly string[]).includes(view)) bossView(view as BossId, t);
  else unitsView(t);
  const p = target(t);
  ctx.strokeStyle = '#ffe15a';
  ctx.beginPath();
  ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
  ctx.stroke();
  requestAnimationFrame(frame);
}
frame();
