import type { TokenRecord } from '../../domain/vault/token-record';
import type { VaultDeps } from './vault-deps';

export type RestoreResult =
  | { readonly kind: 'restored' }
  | { readonly kind: 'duplicate' }
  | { readonly kind: 'saveFailed' };

/** Puts a deleted token back at its original position, or at the end if the list shrank. */
export async function restoreToken(
  record: TokenRecord,
  index: number,
  { repository }: VaultDeps,
): Promise<RestoreResult> {
  const { state } = await repository.load();
  if (state.tokens.some((token) => token.id === record.id || token.raw === record.raw)) {
    return { kind: 'duplicate' };
  }
  const tokens = [...state.tokens];
  tokens.splice(Math.min(index, tokens.length), 0, record);
  const saved = await repository.save({ tokens });
  return saved.ok ? { kind: 'restored' } : { kind: 'saveFailed' };
}
