import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The ladder image copies single files (server/Dockerfile): every file the service imports must reach the runtime
// stage, and every shared src/ file the type-check stage too, or the image fails its check or the container fails
// to start (docs 27, 34).

const read = (path: string): string => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

/** Every file reachable from the service entry through relative `.ts` imports. */
function serviceFiles(): string[] {
  const seen = new Set<string>();
  const visit = (path: string): void => {
    if (seen.has(path)) return;
    seen.add(path);
    const dir = path.slice(0, path.lastIndexOf('/'));
    for (const m of read(path).matchAll(/from '(\.[^']+\.ts)'/g)) visit(new URL(m[1] ?? '', `file:///${dir}/`).pathname.slice(1));
  };
  visit('server/ladder/main.ts');
  return [...seen].sort();
}

describe('Ladder image', () => {
  it('copies every file the service imports into the runtime stage', () => {
    const runtime = read('server/Dockerfile').split('\n').filter((l) => l.startsWith('COPY --from=check')).join('\n');
    for (const file of serviceFiles()) expect(runtime, file).toContain(`/app/${file}`);
  });

  it('type-checks every shared source file in the image', () => {
    const check = read('server/Dockerfile').split('\n').filter((l) => l.startsWith('COPY src/')).join('\n');
    const tsconfig = read('tsconfig.server.json');
    for (const file of serviceFiles().filter((f) => f.startsWith('src/'))) {
      expect(check, file).toContain(file);
      expect(tsconfig, file).toContain(file);
    }
  });
});
