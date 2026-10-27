import { createServer } from 'node:http';
import { ladderHandler } from './http.ts';
import { log } from './log.ts';
import { LADDER, openStore, SAVES } from './store.ts';

// Ladder service entry (docs 27, 34): one process, two JSON files on the data volume — the ladder and the pilots'
// cloud saves. Node runs this TypeScript directly (type stripping), so imports carry `.ts` and the syntax stays erasable.

const port = Number(process.env.PORT ?? '8090');
const file = process.env.LADDER_FILE ?? '/data/ladder.json';
const savesFile = process.env.SAVES_FILE ?? '/data/saves.json';

const ladder = await openStore(file, LADDER);
const saves = await openStore(savesFile, SAVES);
const server = createServer(ladderHandler({ ladder, saves }));
server.requestTimeout = 10_000;
server.headersTimeout = 5_000;
server.keepAliveTimeout = 5_000;

let stopping = false;
async function shutdown(reason: string, code: number): Promise<void> {
  if (stopping) return;
  stopping = true;
  log(code === 0 ? 'info' : 'error', 'shutting down', { reason });
  const force = setTimeout(() => process.exit(1), 8_000);
  force.unref();
  try {
    const closed = new Promise<void>((done) => server.close(() => done()));
    server.closeIdleConnections();
    await closed;
    await Promise.all([ladder.flush(), saves.flush()]);
    process.exit(code);
  } catch (err) {
    log('error', 'shutdown failed', { err: err instanceof Error ? err.message : 'unknown' });
    process.exit(1);
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM', 0));
process.on('SIGINT', () => void shutdown('SIGINT', 0));
process.on('uncaughtException', (err) => void shutdown(`uncaught: ${err.message}`, 1));
process.on('unhandledRejection', (why) => void shutdown(`unhandled rejection: ${why instanceof Error ? why.message : 'unknown'}`, 1));

server.listen(port, '0.0.0.0', () => log('info', 'ladder listening', { port, file, savesFile }));
