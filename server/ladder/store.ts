import { readFile, rename, writeFile } from 'node:fs/promises';
import { emptyTable, parseTable, type LadderTable } from '../../src/game/ladder.ts';
import { log } from './log.ts';

// The ladder table in memory, persisted to one JSON file (doc 27): atomic writes (temp file +
// rename), at most one per `delayMs`. A write failure rejects unhandled and crashes the process.

export interface Store {
  get(): LadderTable;
  /** Replaces the table and schedules a write. */
  set(table: LadderTable): void;
  /** Writes pending changes now (shutdown). */
  flush(): Promise<void>;
}

const errCode = (err: unknown): string | undefined =>
  typeof err === 'object' && err !== null && 'code' in err && typeof err.code === 'string' ? err.code : undefined;

async function load(file: string): Promise<LadderTable> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (err) {
    if (errCode(err) === 'ENOENT') return emptyTable();
    throw err;
  }
  try {
    return parseTable(JSON.parse(text));
  } catch {
    const aside = `${file}.corrupt-${Date.now()}`;
    await rename(file, aside);
    log('error', 'ladder file unreadable, moved aside, starting empty', { aside });
    return emptyTable();
  }
}

export async function openStore(file: string, delayMs = 1000): Promise<Store> {
  let table = await load(file);
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
