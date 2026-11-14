// Colour maths for the detail kit (doc 113): lighter and darker steps of a paint for bevels and shading. Pure.

type Rgb = readonly [number, number, number];

function parse(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h.slice(0, 6);
  const n = Number.parseInt(full, 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [0, 0, 0];
}

const hex2 = (v: number): string => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
const format = (c: Rgb): string => `#${hex2(c[0])}${hex2(c[1])}${hex2(c[2])}`;

/** `a` → `b` by k (0 … 1), linear in RGB. */
export function mix(a: string, b: string, k: number): string {
  const x = parse(a);
  const y = parse(b);
  const t = Math.max(0, Math.min(1, k));
  return format([x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t]);
}

/** k > 0 toward white, k < 0 toward black (|k| ≤ 1). */
export const shade = (hex: string, k: number): string => (k >= 0 ? mix(hex, '#ffffff', k) : mix(hex, '#000000', -k));
