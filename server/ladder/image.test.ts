import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The ladder image copies single files (server/Dockerfile): every file the service imports from src/ must be
// copied into both stages, or the image fails its type-check or the container fails to start (doc 27).

const read = (path: string): string => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

/** src/ files reachable from the shared ladder rules through relative `.ts` imports. */
function sharedFiles(): string[] {
  const seen = new Set<string>();
  const visit = (path: string): void => {
    if (seen.has(path)) return;
    seen.add(path);
    const dir = path.slice(0, path.lastIndexOf('/'));
    for (const m of read(path).matchAll(/from '(\.[^']+\.ts)'/g)) visit(new URL(m[1] ?? '', `file:///${dir}/`).pathname.slice(1));
  };
  visit('src/game/ladder.ts');
  return [...seen].sort();
}

describe('Ladder image', () => {
  it('copies every shared source file the service imports, in both stages', () => {
    const docker = read('server/Dockerfile');
    for (const file of sharedFiles()) {
      const copies = docker.split('\n').filter((l) => l.startsWith('COPY') && l.includes(file.slice(file.lastIndexOf('/') + 1)));
      expect(copies.length, file).toBeGreaterThanOrEqual(2);
    }
    for (const file of sharedFiles()) expect(read('tsconfig.server.json'), file).toContain(file);
  });
});
