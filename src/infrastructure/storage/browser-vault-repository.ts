import { storage } from 'wxt/utils/storage';

import type {
  SaveResult,
  Unsubscribe,
  VaultLoadResult,
  VaultRepository,
} from '../../application/ports/vault-repository';
import type { VaultState } from '../../domain/vault/token-record';
import { parseVault } from './vault-schema';

/**
 * The vault lives in one versioned item in `storage.local`: private to the extension, never
 * synced (FR-020). One item means every change is a single atomic write (research R3).
 */
const vaultItem = storage.defineItem<unknown>('local:vault', {
  version: 1,
  migrations: {},
});

function isQuotaError(error: unknown): boolean {
  return error instanceof Error && /quota/iu.test(error.message);
}

export class BrowserVaultRepository implements VaultRepository {
  async load(): Promise<VaultLoadResult> {
    return parseVault(await vaultItem.getValue());
  }

  async save(state: VaultState): Promise<SaveResult> {
    try {
      await vaultItem.setValue(state);
      return { ok: true };
    } catch (error: unknown) {
      return { ok: false, reason: isQuotaError(error) ? 'quota' : 'unknown' };
    }
  }

  subscribe(listener: (state: VaultState) => void): Unsubscribe {
    return vaultItem.watch((stored) => {
      listener(parseVault(stored).state);
    });
  }
}
