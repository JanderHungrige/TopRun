// One JSON line per event on stdout (the container's log driver collects it). Never log bodies or secrets.

export type Level = 'info' | 'warn' | 'error';

export function log(level: Level, msg: string, fields: Readonly<Record<string, string | number | boolean>> = {}): void {
  process.stdout.write(`${JSON.stringify({ t: new Date().toISOString(), level, msg, ...fields })}\n`);
}
