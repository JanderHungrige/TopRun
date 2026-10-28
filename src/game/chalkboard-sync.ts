import { boardSum, emptyCells, type Cells } from './chalkboard';
import { MAX_OPS, type BoardReply } from './chalkboard-codec';
import { applyOp, applyOps, type Op } from './chalkboard-ops';

// Chalkboard (doc 40): the browser's copy of the shared board. The service's board at `rev` plus the ops posted and
// not yet answered (in flight) plus the ops drawn since (pending) is what the player sees. No I/O here: the scene
// asks what to post and hands in the replies.

export type ReceiveResult = 'ok' | 'drift';
export type FailMode = 'retry' | 'dropChalk' | 'dropAll';

export class BoardSync {
  rev = 0;
  /** Counts every change of the view (repaint when it moves). */
  version = 0;
  /** Whether a reply has arrived yet (before that the board is unknown, not empty). */
  known = false;
  private server: Cells = emptyCells();
  private inFlight: Op[] = [];
  private pending: Op[] = [];
  private shown: Cells = emptyCells();

  /** What the player sees: the service's board with this browser's ops on top. */
  get view(): Cells {
    return this.shown;
  }

  get busy(): boolean {
    return this.inFlight.length > 0;
  }

  get waiting(): number {
    return this.pending.length;
  }

  /** A finished stroke of this player's. */
  add(op: Op): void {
    this.pending.push(op);
    applyOp(this.shown, op);
    this.version++;
  }

  /** The next ops to post (moved in flight), or null when nothing waits or a post is still out. */
  takePost(): Op[] | null {
    if (this.busy || this.pending.length === 0) return null;
    this.inFlight = this.pending.splice(0, MAX_OPS);
    return this.inFlight;
  }

  /** A post failed: its ops wait again in front, without the chalk (refused) or without any of them (bad ops). */
  postFailed(mode: FailMode): void {
    const back = mode === 'retry' ? this.inFlight : mode === 'dropChalk' ? this.inFlight.filter((op) => op.t !== 'c') : [];
    const dropped = back.length !== this.inFlight.length;
    this.inFlight = [];
    this.pending = [...back, ...this.pending];
    if (dropped) this.rebuild();
  }

  /** A reply to a GET or a POST (a POST's reply holds its own ops). 'drift': fetch the whole board. */
  receive(reply: BoardReply): ReceiveResult {
    this.inFlight = [];
    if ('cells' in reply) {
      this.server = reply.cells;
    } else {
      for (const { rev, op } of reply.ops) if (rev > this.rev) applyOp(this.server, op);
    }
    this.rev = reply.rev;
    this.known = true;
    this.rebuild();
    return boardSum(this.server) === reply.sum ? 'ok' : 'drift';
  }

  /** The view again from the service's board and this browser's unanswered ops. */
  private rebuild(): void {
    this.shown = this.server.slice();
    applyOps(this.shown, this.inFlight);
    applyOps(this.shown, this.pending);
    this.version++;
  }
}
