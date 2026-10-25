// Carrier Landing camera (doc 18): the pilot's eye in the landing frame (x right, y up, z forward from the
// ramp), looking along the nose with yaw / pitch / roll. Points project with a pinhole; polygons and lines are
// clipped against the near plane first, so the deck still draws while the eye is over it.

export const VIEW = Object.freeze({ f: 1250, cx: 640, cy: 255, near: 0.6 });

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Cam {
  x: number;
  y: number;
  z: number;
  /** Nose right (rad). */
  yaw: number;
  /** Nose up (rad). */
  pitch: number;
  /** Right wing down (rad). */
  roll: number;
}

/** A projected point, its scale (px per metre) and depth (m). */
export interface Pt {
  x: number;
  y: number;
  s: number;
  d: number;
}

export const v3 = (x: number, y: number, z: number): Vec3 => ({ x, y, z });

/** World point → camera space (x right, y up, z along the view). */
export function toCam(cam: Cam, p: Vec3): Vec3 {
  const dx = p.x - cam.x;
  const dy = p.y - cam.y;
  const dz = p.z - cam.z;
  const cy = Math.cos(cam.yaw);
  const sy = Math.sin(cam.yaw);
  const x1 = dx * cy - dz * sy;
  const z1 = dx * sy + dz * cy;
  const cp = Math.cos(cam.pitch);
  const sp = Math.sin(cam.pitch);
  const y2 = dy * cp - z1 * sp;
  const z2 = dy * sp + z1 * cp;
  const cr = Math.cos(cam.roll);
  const sr = Math.sin(cam.roll);
  return { x: x1 * cr - y2 * sr, y: x1 * sr + y2 * cr, z: z2 };
}

/** Camera-space point → screen (it must lie in front of the near plane). */
export function screen(c: Vec3): Pt {
  const s = VIEW.f / c.z;
  return { x: VIEW.cx + c.x * s, y: VIEW.cy - c.y * s, s, d: c.z };
}

export function project(cam: Cam, p: Vec3): Pt | null {
  const c = toCam(cam, p);
  return c.z < VIEW.near ? null : screen(c);
}

/** A direction at infinity (stars, the moon, the velocity vector), or null behind the eye. */
export function projectDir(cam: Cam, d: Vec3): Pt | null {
  const c = toCam({ ...cam, x: 0, y: 0, z: 0 }, d);
  return c.z <= 1e-6 ? null : screen(c);
}

const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t });

/** Projects a polygon, clipped against the near plane; empty when it is entirely behind the eye. */
export function projectPoly(cam: Cam, pts: readonly Vec3[]): Pt[] {
  const c = pts.map((p) => toCam(cam, p));
  const out: Vec3[] = [];
  for (let i = 0; i < c.length; i++) {
    const a = c[i];
    const b = c[(i + 1) % c.length];
    if (!a || !b) continue;
    const ain = a.z >= VIEW.near;
    const bin = b.z >= VIEW.near;
    if (ain) out.push(a);
    if (ain !== bin) out.push(lerp3(a, b, (VIEW.near - a.z) / (b.z - a.z)));
  }
  return out.map(screen);
}

/** Projects a segment, clipped against the near plane. */
export function projectLine(cam: Cam, a: Vec3, b: Vec3): [Pt, Pt] | null {
  let ca = toCam(cam, a);
  let cb = toCam(cam, b);
  if (ca.z < VIEW.near && cb.z < VIEW.near) return null;
  if (ca.z < VIEW.near) ca = lerp3(ca, cb, (VIEW.near - ca.z) / (cb.z - ca.z));
  else if (cb.z < VIEW.near) cb = lerp3(cb, ca, (VIEW.near - cb.z) / (ca.z - cb.z));
  return [screen(ca), screen(cb)];
}

export function fillPoly(ctx: CanvasRenderingContext2D, pts: readonly Pt[], fill: string | CanvasGradient): void {
  const [first, ...rest] = pts;
  if (!first || rest.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(first.x, first.y);
  for (const p of rest) ctx.lineTo(p.x, p.y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

/** The horizon in screen space: a point on it and its direction (roll). */
export function horizon(cam: Cam): { x: number; y: number; angle: number } {
  const ahead = projectDir(cam, v3(Math.sin(cam.yaw), 0, Math.cos(cam.yaw)));
  return { x: ahead?.x ?? VIEW.cx, y: ahead?.y ?? VIEW.cy, angle: -cam.roll };
}
