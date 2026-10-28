import { BoardSync, type FailMode } from '../game/chalkboard-sync';
import type { SaveData } from '../game/save';
import { fetchBoard, postBoard, type BoardResult } from './chalkboard-api';

// The browser's line to the shared chalkboard (doc 40): one request at a time — post the strokes waiting (at most
// every 2 s), otherwise poll for what others drew; back off while the service is away. One link for the session, so
// the hangar's miniature and the board scene share what they know.

export type LinkStatus = 'loading' | 'online' | 'offline';

export interface BoardIdentity { id: string; secret: string }

const POST_GAP_MS = 2000;
const MAX_BACKOFF_MS = 30_000;

/** 403: the chalk is refused (wipes go again); 400 / 413: the ops are bad, drop them; anything else: try again. */
function failMode(status: number): FailMode {
  if (status === 403) return 'dropChalk';
  return status === 400 || status === 413 ? 'dropAll' : 'retry';
}

export class BoardLink {
  readonly sync = new BoardSync();
  status: LinkStatus = 'loading';
  /** The service refused chalk from this pilot (not on the online ladder). */
  refused = false;
  private busy = false;
  private nextPost = 0;
  private nextPoll = 0;
  private backoff = 0;

  /**
   * Call every frame; `pollMs` = how often to ask for others' strokes; `who` signs chalk (null: wipes only);
   * `hold` keeps strokes back (the pilot's ladder entry is still being posted).
   */
  tick(now: number, pollMs: number, who: BoardIdentity | null, hold = false): void {
    if (this.busy) return;
    if (this.sync.waiting > 0 && !hold && now >= this.nextPost) void this.post(now, who);
    else if (now >= this.nextPoll) void this.poll(now, pollMs);
  }

  /** Ask again on the next tick and give the pilot's chalk another chance (entering a screen). */
  refresh(): void {
    this.nextPoll = 0;
    this.refused = false;
  }

  private async poll(now: number, pollMs: number): Promise<void> {
    this.busy = true;
    const r = await fetchBoard(this.sync.known ? this.sync.rev : null);
    this.busy = false;
    if (r.ok) this.nextPoll = now + pollMs;
    this.handle(r, now);
  }

  private async post(now: number, who: BoardIdentity | null): Promise<void> {
    const ops = this.sync.takePost();
    if (!ops) return;
    this.busy = true;
    const r = await postBoard({ ...(who ?? {}), since: this.sync.rev, ops });
    this.busy = false;
    this.nextPost = now + POST_GAP_MS;
    if (!r.ok) this.sync.postFailed(failMode(r.status));
    if (!r.ok && r.status === 403) this.refused = true;
    this.handle(r, now);
  }

  private handle(r: BoardResult, now: number): void {
    if (r.ok) {
      this.status = 'online';
      this.backoff = 0;
      if (this.sync.receive(r.reply) === 'drift') {
        this.sync.known = false;
        this.nextPoll = 0;
      }
      return;
    }
    if (failMode(r.status) !== 'retry') return;
    if (r.status === 429) {
      this.nextPost = now + 5000;
      return;
    }
    this.status = 'offline';
    this.backoff = Math.min(MAX_BACKOFF_MS, Math.max(2000, this.backoff * 2));
    this.nextPoll = now + this.backoff;
    this.nextPost = now + this.backoff;
  }
}

/** The active pilot's ladder id + secret while it is shown on the online ladder — what signs its chalk. */
export function boardIdentity(save: SaveData): BoardIdentity | null {
  const l = save.ladder;
  return l?.share ? { id: l.id, secret: l.secret } : null;
}

let link: BoardLink | null = null;

/** The session's board link. */
export const boardLink = (): BoardLink => (link ??= new BoardLink());
