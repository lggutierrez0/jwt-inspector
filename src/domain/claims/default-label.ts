import type { JsonObject } from '../jwt/types';
import { LABEL_MAX_LENGTH } from '../vault/token-record';

// Labels are always visible, so they never come from personal data that the detail masks.
const LABEL_CLAIMS = ['preferred_username', 'sub', 'iss'] as const;
const GENERIC_LABEL = /^Token (\d+)$/u;

/**
 * Default label for a new token (FR-011): the first non-empty, non-sensitive identifying claim,
 * otherwise "Token N" with the smallest N not already used.
 */
export function defaultLabel(payload: JsonObject, existingLabels: readonly string[]): string {
  for (const claim of LABEL_CLAIMS) {
    const value = payload[claim];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim().slice(0, LABEL_MAX_LENGTH);
    }
  }
  const used = new Set(
    existingLabels.flatMap((label) => {
      const match = GENERIC_LABEL.exec(label);
      return match?.[1] === undefined ? [] : [Number(match[1])];
    }),
  );
  let next = 1;
  while (used.has(next)) next += 1;
  return `Token ${next}`;
}
