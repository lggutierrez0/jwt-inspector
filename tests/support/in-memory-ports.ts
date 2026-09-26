import type { Clipboard } from '@/application/ports/clipboard';
import type { Clock } from '@/application/ports/clock';
import type { IdGenerator } from '@/application/ports/id-generator';
import type {
  SaveResult,
  Unsubscribe,
  VaultLoadResult,
  VaultRepository,
} from '@/application/ports/vault-repository';
import { EMPTY_VAULT, type VaultState } from '@/domain/vault/token-record';

/** In-memory vault. Can simulate another panel writing and storage failures. */
export class InMemoryVaultRepository implements VaultRepository {
  state: VaultState;
  droppedCount = 0;
  failNextSave: SaveResult | null = null;
  /** Like the real storage: change events arrive after `save` resolves. */
  deferNotifications = false;
  saves = 0;
  readonly #listeners = new Set<(state: VaultState) => void>();

  constructor(initial: VaultState = EMPTY_VAULT) {
    this.state = initial;
  }

  load(): Promise<VaultLoadResult> {
    return Promise.resolve({ state: this.state, droppedCount: this.droppedCount });
  }

  save(state: VaultState): Promise<SaveResult> {
    if (this.failNextSave) {
      const failure = this.failNextSave;
      this.failNextSave = null;
      return Promise.resolve(failure);
    }
    this.saves += 1;
    this.state = state;
    if (this.deferNotifications) {
      setTimeout(() => {
        this.#emit();
      }, 0);
    } else {
      this.#emit();
    }
    return Promise.resolve({ ok: true });
  }

  subscribe(listener: (state: VaultState) => void): Unsubscribe {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  /** Simulates a change made by another open panel. */
  externalWrite(state: VaultState): void {
    this.state = state;
    this.#emit();
  }

  #emit(): void {
    for (const listener of this.#listeners) listener(this.state);
  }
}

export class FixedClock implements Clock {
  constructor(public current: number) {}
  now(): number {
    return this.current;
  }
}

export class RecordingClipboard implements Clipboard {
  readonly written: string[] = [];
  fail = false;
  writeText(text: string): Promise<{ readonly ok: boolean }> {
    if (this.fail) return Promise.resolve({ ok: false });
    this.written.push(text);
    return Promise.resolve({ ok: true });
  }
}

export class SequentialIdGenerator implements IdGenerator {
  #count = 0;
  next(): string {
    this.#count += 1;
    return `id-${this.#count}`;
  }
}
