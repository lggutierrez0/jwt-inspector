import * as v from 'valibot';

import type { VaultLoadResult } from '../../application/ports/vault-repository';
import { MAX_TOKEN_BYTES } from '../../domain/jwt/decode';
import {
  LABEL_MAX_LENGTH,
  TOKEN_SOURCE_KINDS,
  type TokenRecord,
} from '../../domain/vault/token-record';

// Persisted format v1 (contracts/storage-vault-v1.md). Strict objects: an unknown field is a
// record that does not match the contract, which also keeps secrets from slipping in (FR-021).
const sourceSchema = v.strictObject({
  kind: v.picklist(TOKEN_SOURCE_KINDS),
  origin: v.exactOptional(v.string()),
  name: v.exactOptional(v.string()),
  key: v.exactOptional(v.string()),
});

const recordSchema = v.strictObject({
  id: v.pipe(v.string(), v.nonEmpty()),
  raw: v.pipe(v.string(), v.nonEmpty(), v.maxBytes(MAX_TOKEN_BYTES)),
  kind: v.picklist(['jws', 'jwe']),
  label: v.pipe(
    v.string(),
    v.check((label) => {
      const length = label.trim().length;
      return length >= 1 && length <= LABEL_MAX_LENGTH;
    }),
  ),
  source: sourceSchema,
  addedAt: v.pipe(v.number(), v.finite(), v.minValue(0)),
});

const documentSchema = v.object({ tokens: v.array(v.unknown()) });

/**
 * Parses whatever is stored into a typed vault. Invalid or duplicate records are dropped and
 * counted, never repaired silently; a missing or foreign document is an empty vault.
 */
export function parseVault(stored: unknown): VaultLoadResult {
  const document = v.safeParse(documentSchema, stored);
  if (!document.success) return { state: { tokens: [] }, droppedCount: 0 };

  const tokens: TokenRecord[] = [];
  const ids = new Set<string>();
  const raws = new Set<string>();
  for (const candidate of document.output.tokens) {
    const parsed = v.safeParse(recordSchema, candidate);
    if (parsed.success && !ids.has(parsed.output.id) && !raws.has(parsed.output.raw)) {
      ids.add(parsed.output.id);
      raws.add(parsed.output.raw);
      tokens.push(parsed.output);
    }
  }
  return { state: { tokens }, droppedCount: document.output.tokens.length - tokens.length };
}
