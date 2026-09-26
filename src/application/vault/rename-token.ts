import { validateLabel } from '../../domain/vault/label';
import type { VaultDeps } from './vault-deps';

export type RenameResult =
  | { readonly kind: 'renamed' }
  | { readonly kind: 'invalidLabel'; readonly reason: 'empty' | 'tooLong' }
  | { readonly kind: 'notFound' }
  | { readonly kind: 'saveFailed' };

/** Renames a token's label (FR-017). */
export async function renameToken(
  id: string,
  input: string,
  { repository }: VaultDeps,
): Promise<RenameResult> {
  const validation = validateLabel(input);
  if (!validation.ok) return { kind: 'invalidLabel', reason: validation.reason };
  const { state } = await repository.load();
  const index = state.tokens.findIndex((token) => token.id === id);
  const record = state.tokens[index];
  if (record === undefined) return { kind: 'notFound' };
  const tokens = state.tokens.with(index, { ...record, label: validation.label });
  const saved = await repository.save({ tokens });
  return saved.ok ? { kind: 'renamed' } : { kind: 'saveFailed' };
}
