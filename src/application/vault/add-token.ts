import { defaultLabel } from '../../domain/claims/default-label';
import { decodeToken } from '../../domain/jwt/decode';
import { normalizeTokenInput } from '../../domain/jwt/normalize';
import type { DecodeError } from '../../domain/jwt/types';
import {
  findByRaw,
  prependRecord,
  type TokenRecord,
  type TokenSource,
} from '../../domain/vault/token-record';
import type { Clock } from '../ports/clock';
import type { IdGenerator } from '../ports/id-generator';
import type { VaultRepository } from '../ports/vault-repository';

export interface AddTokenDeps {
  readonly repository: VaultRepository;
  readonly clock: Clock;
  readonly ids: IdGenerator;
}

export type AddTokenResult =
  | { readonly kind: 'added'; readonly record: TokenRecord }
  | { readonly kind: 'unsupportedJwe'; readonly record: TokenRecord }
  | { readonly kind: 'duplicate'; readonly id: string }
  | { readonly kind: 'invalid'; readonly error: DecodeError }
  | { readonly kind: 'saveFailed'; readonly reason: 'quota' | 'unknown' };

/** Decodes, deduplicates and saves a token (FR-001–FR-006). Never throws for expected failures. */
export async function addToken(
  input: string,
  source: TokenSource,
  { repository, clock, ids }: AddTokenDeps,
): Promise<AddTokenResult> {
  const raw = normalizeTokenInput(input);
  const decoded = decodeToken(raw);
  if (!decoded.ok) return { kind: 'invalid', error: decoded.error };

  const { state } = await repository.load();
  const existing = findByRaw(state, raw);
  if (existing !== undefined) return { kind: 'duplicate', id: existing.id };

  const { token } = decoded;
  const record: TokenRecord = {
    id: ids.next(),
    raw,
    kind: token.kind,
    label: defaultLabel(
      token.kind === 'jws' ? token.payload : {},
      state.tokens.map((item) => item.label),
    ),
    source,
    addedAt: clock.now(),
  };

  const saved = await repository.save(prependRecord(state, record));
  if (!saved.ok) return { kind: 'saveFailed', reason: saved.reason };
  return token.kind === 'jws' ? { kind: 'added', record } : { kind: 'unsupportedJwe', record };
}
