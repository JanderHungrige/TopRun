import type { SaveData } from '../game/save';
import { putSave } from './ladder-api';

// Keeps the active pilot's cloud save current (doc 34): poked with the ladder sync, uploads after the ladder post
// (the service keeps a save only for an existing entry), and only when the save changed since the last upload.

export interface CloudUpload {
  id: string;
  secret: string;
  save: SaveData;
}

export class CloudSync {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly sent = new Map<string, string>();

  constructor(
    private readonly upload: () => CloudUpload | null,
    private readonly before: () => Promise<unknown>,
    private readonly put: (id: string, secret: string, save: SaveData) => Promise<boolean> = putSave,
    private readonly delayMs = 4000,
  ) {}

  /** The save may have changed. */
  poke(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.flush(), this.delayMs);
  }

  /** Uploads now if needed; false while not shared, offline or refused. */
  async flush(): Promise<boolean> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const up = this.upload();
    if (!up) return false;
    const key = JSON.stringify(up.save);
    if (this.sent.get(up.id) === key) return true;
    await this.before();
    const ok = await this.put(up.id, up.secret, up.save);
    if (ok) this.sent.set(up.id, key);
    return ok;
  }
}
