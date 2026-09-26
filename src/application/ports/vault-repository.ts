import type { VaultState } from '../../domain/vault/token-record';

export interface VaultLoadResult {
  readonly state: VaultState;
  /** Records dropped because they did not match the persisted format. */
  readonly droppedCount: number;
}

export type SaveResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: 'quota' | 'unknown' };

export type Unsubscribe = () => void;

/** Persistence of the vault (contracts/ports.md). Failures are values, never thrown. */
export interface VaultRepository {
  load(): Promise<VaultLoadResult>;
  save(state: VaultState): Promise<SaveResult>;
  /** Notified with parsed state whenever any extension page changes the vault. */
  subscribe(listener: (state: VaultState) => void): Unsubscribe;
}
