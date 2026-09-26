import type { TokenRecord } from '../../domain/vault/token-record';
import type { VaultDeps } from './vault-deps';

export type DeleteResult =
  | { readonly kind: 'deleted'; readonly record: TokenRecord; readonly index: number }
  | { readonly kind: 'notFound' }
  | { readonly kind: 'saveFailed' };

/** Deletes one token and returns what `restoreToken` needs to undo it (FR-018). */
export async function deleteToken(id: string, { repository }: VaultDeps): Promise<DeleteResult> {
  const { state } = await repository.load();
  const index = state.tokens.findIndex((token) => token.id === id);
  const record = state.tokens[index];
  if (record === undefined) return { kind: 'notFound' };
  const saved = await repository.save({ tokens: state.tokens.filter((token) => token.id !== id) });
  return saved.ok ? { kind: 'deleted', record, index } : { kind: 'saveFailed' };
}
