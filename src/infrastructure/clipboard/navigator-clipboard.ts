import type { Clipboard } from '../../application/ports/clipboard';

/** Gesture-initiated writes only; no `clipboardWrite` permission needed (research R8). */
export class NavigatorClipboard implements Clipboard {
  async writeText(text: string): Promise<{ readonly ok: boolean }> {
    try {
      await navigator.clipboard.writeText(text);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }
}
