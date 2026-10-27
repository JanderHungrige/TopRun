import { readFile, rename, writeFile } from 'node:fs/promises';
import { emptyTable, parseTable, type LadderTable } from '../../src/game/ladder.ts';
import { emptySaves, parseSaves, type SaveTable } from '../../src/game/ladder-cloud.ts';
import { log } from './log.ts';

// A table in memory, persisted to one JSON file (docs 27, 34): atomic writes (temp file + rename), at most one
// per `delayMs`. A write failure rejects unhandled and crashes the process.

export interface Store<T> {
  get(): T;
  /** Replaces the table and schedules a write. */
  set(table: T): void;
  /** Writes pending changes now (shutdown). */
  flush(): Promise<void>;
}

/** How a table starts and how a stored file is read back (defensively). */
export interface Codec<T> {
  empty(): T;
  parse(v: unknown): T;
}

export const LADDER: Codec<LadderTable> = { empty: emptyTable, parse: parseTable };
export const SAVES: Codec<SaveTable> = { empty: emptySaves, parse: parseSaves };

const errCode = (err: unknown): string | undefined =>
  typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string' ? err.code : undefined;

async function load<T>(file: string, codec: Codec<T>): Promise<T> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (err) {
    if (errCode(err) === 'ENOENT') return codec.empty();
    throw err;
  }
  try {
    return codec.parse(JSON.parse(text));
  } catch {
    const aside = `${file}.corrupt-${Date.now()}`;
    await rename(file, aside);
    log('error', 'store file unreadable, moved aside, starting empty', { aside });
    return codec.empty();
  }
}

export async function openStore<T>(file: string, codec: Codec<T>, delayMs = 1000): Promise<Store<T>> {
  let table: T = await load(file, codec);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let dirty = false;
  let writing: Promise<void> = Promise.resolve();

  const write = (): Promise<void> => {
    timer = null;
    if (!dirty) return writing;
    dirty = false;
    const snapshot = JSON.stringify(table);
    writing = writing.then(async () => {
      const tmp = `${file}.tmp`;
      await writeFile(tmp, snapshot, 'utf8');
      await rename(tmp, file);
    });
    return writing;
  };

  return {
    get: () => table,
    set(next) {
      table = next;
      dirty = true;
      timer ??= setTimeout(() => void write(), delayMs);
    },
    flush() {
      if (timer) clearTimeout(timer);
      return write();
    },
  };
}
