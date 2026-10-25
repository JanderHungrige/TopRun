import type { Submission } from '../game/ladder';
import type { PostReply } from '../game/ladder-stats';
import { postPilot } from './ladder-api';

// Keeps the active pilot's ladder entry current (doc 28): poked after every save, posts at most
// once per `delayMs`, and only when the submission changed since the last accepted one.

export class LadderSync {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly sent = new Map<string, string>();
  private readonly replies = new Map<string, PostReply>();

  constructor(
    private readonly submission: () => Submission | null,
    private readonly post: (sub: Submission) => Promise<PostReply | null> = postPilot,
    private readonly delayMs = 2500,
  ) {}

  /** Something the rating depends on may have changed. */
  poke(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.delayMs);
  }

  /** Posts now if needed; resolves with the pilot's latest place, or null (sharing off, offline). */
  async flush(): Promise<PostReply | null> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const sub = this.submission();
    if (!sub) return null;
    const key = JSON.stringify(sub);
    if (this.sent.get(sub.id) === key) return this.replies.get(sub.id) ?? null;
    const reply = await this.post(sub);
    if (reply) {
      this.sent.set(sub.id, key);
      this.replies.set(sub.id, reply);
    }
    return reply;
  }

  /** The last place the service gave this pilot in this session. */
  replyFor(id: string): PostReply | null {
    return this.replies.get(id) ?? null;
  }

  /** After an opt-out: the next flush posts again. */
  forget(id: string): void {
    this.sent.delete(id);
    this.replies.delete(id);
  }
}
