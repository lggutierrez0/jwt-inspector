import { isRecordExpired } from '../../domain/vault/expiry';
import type { ClearResult } from './clear-all';
import type { VaultDeps } from './vault-deps';

/** Removes only expired tokens, on explicit request; nothing is ever removed automatically (FR-023). */
export async function clearExpired(now: number, { repository }: VaultDeps): Promise<ClearResult> {
  const { state } = await repository.load();
  const tokens = state.tokens.filter((token) => !isRecordExpired(token, now));
  const count = state.tokens.length - tokens.length;
  if (count === 0) return { kind: 'cleared', count };
  const saved = await repository.save({ tokens });
  return saved.ok ? { kind: 'cleared', count } : { kind: 'saveFailed' };
}
