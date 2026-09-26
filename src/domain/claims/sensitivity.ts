import type { JsonValue } from '../jwt/types';

/** Personal-data claims (OpenID Connect Core 1.0, Section 5.1) masked by default (FR-015). */
const PERSONAL_CLAIMS = new Set([
  'email',
  'name',
  'given_name',
  'family_name',
  'middle_name',
  'nickname',
  'phone_number',
  'address',
  'birthdate',
]);

const SECRET_WORDS = /password|secret|token|key/iu;

/**
 * Whether the claim at `path` (e.g. `['credentials', 'apiKey']`) is masked by default: a
 * personal-data claim as the last segment, or any segment that looks like a secret.
 */
export function isSensitiveClaim(path: readonly string[]): boolean {
  const last = path.at(-1);
  if (last !== undefined && PERSONAL_CLAIMS.has(last)) return true;
  return path.some((segment) => SECRET_WORDS.test(segment));
}

/** Placeholder for a redacted value; the UI renders it with the localized "masked" word. */
export const MASKED = '[masked]';

export interface Redaction {
  readonly value: JsonValue;
  readonly redacted: boolean;
}

/** Copy of `value` with every sensitive entry (by `isSensitiveClaim`) replaced by `MASKED`. */
export function redactSensitive(value: JsonValue, path: readonly string[]): Redaction {
  if (path.length > 0 && isSensitiveClaim(path)) return { value: MASKED, redacted: true };
  if (Array.isArray(value)) {
    const items = value.map((item) => redactSensitive(item, path));
    return {
      value: items.map((item) => item.value),
      redacted: items.some((item) => item.redacted),
    };
  }
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value).map(
      ([key, child]) => [key, redactSensitive(child, [...path, key])] as const,
    );
    return {
      value: Object.fromEntries(entries.map(([key, child]) => [key, child.value])),
      redacted: entries.some(([, child]) => child.redacted),
    };
  }
  return { value, redacted: false };
}
