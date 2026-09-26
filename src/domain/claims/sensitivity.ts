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
