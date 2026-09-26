import type { VaultDeps } from './vault-deps';

export type ClearResult =
  | { readonly kind: 'cleared'; readonly count: number }
  | { readonly kind: 'saveFailed' };

/** Removes every token (FR-019); the caller asks for confirmation first. */
export async function clearAll({ repository }: VaultDeps): Promise<ClearResult> {
  const { state } = await repository.load();
  const saved = await repository.save({ tokens: [] });
  return saved.ok ? { kind: 'cleared', count: state.tokens.length } : { kind: 'saveFailed' };
}
