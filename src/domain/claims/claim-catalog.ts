/**
 * What the detail view can explain about a name (FR-014): a registered name has an i18n key for
 * its title and summary plus the citation of the section that defines it.
 */
export type ClaimInfo<Key extends string = string> =
  | { readonly kind: 'registered'; readonly key: Key; readonly citation: string }
  | { readonly kind: 'custom' };

const JWT_CLAIMS = ['iss', 'sub', 'aud', 'exp', 'nbf', 'iat', 'jti'] as const;
const OIDC_CLAIMS = [
  'name',
  'given_name',
  'family_name',
  'middle_name',
  'nickname',
  'preferred_username',
  'email',
  'phone_number',
  'address',
  'birthdate',
] as const;
export const CLAIM_KEYS = [...JWT_CLAIMS, ...OIDC_CLAIMS] as const;
export type ClaimKey = (typeof CLAIM_KEYS)[number];

export type HeaderParameterKey =
  | 'alg'
  | 'jku'
  | 'jwk'
  | 'kid'
  | 'x5u'
  | 'x5c'
  | 'x5t'
  | 'x5tS256'
  | 'typ'
  | 'cty'
  | 'crit';

const OIDC = 'OpenID Connect Core 1.0, Section 5.1';

/** JWT registered claims (RFC 7519 §4.1) and OpenID standard claims. */
const CLAIMS = new Map<string, { key: ClaimKey; citation: string }>([
  ['iss', { key: 'iss', citation: 'RFC 7519, Section 4.1.1' }],
  ['sub', { key: 'sub', citation: 'RFC 7519, Section 4.1.2' }],
  ['aud', { key: 'aud', citation: 'RFC 7519, Section 4.1.3' }],
  ['exp', { key: 'exp', citation: 'RFC 7519, Section 4.1.4' }],
  ['nbf', { key: 'nbf', citation: 'RFC 7519, Section 4.1.5' }],
  ['iat', { key: 'iat', citation: 'RFC 7519, Section 4.1.6' }],
  ['jti', { key: 'jti', citation: 'RFC 7519, Section 4.1.7' }],
  ...OIDC_CLAIMS.map((name) => [name, { key: name, citation: OIDC }] as const),
]);

/** JWS header parameters (RFC 7515 §4.1). Keys avoid characters i18n message names reject. */
const HEADER_PARAMETERS = new Map<string, { key: HeaderParameterKey; citation: string }>([
  ['alg', { key: 'alg', citation: 'RFC 7515, Section 4.1.1' }],
  ['jku', { key: 'jku', citation: 'RFC 7515, Section 4.1.2' }],
  ['jwk', { key: 'jwk', citation: 'RFC 7515, Section 4.1.3' }],
  ['kid', { key: 'kid', citation: 'RFC 7515, Section 4.1.4' }],
  ['x5u', { key: 'x5u', citation: 'RFC 7515, Section 4.1.5' }],
  ['x5c', { key: 'x5c', citation: 'RFC 7515, Section 4.1.6' }],
  ['x5t', { key: 'x5t', citation: 'RFC 7515, Section 4.1.7' }],
  ['x5t#S256', { key: 'x5tS256', citation: 'RFC 7515, Section 4.1.8' }],
  ['typ', { key: 'typ', citation: 'RFC 7515, Section 4.1.9' }],
  ['cty', { key: 'cty', citation: 'RFC 7515, Section 4.1.10' }],
  ['crit', { key: 'crit', citation: 'RFC 7515, Section 4.1.11' }],
]);

function lookup<Key extends string>(
  catalog: ReadonlyMap<string, { key: Key; citation: string }>,
  name: string,
): ClaimInfo<Key> {
  const entry = catalog.get(name);
  return entry === undefined ? { kind: 'custom' } : { kind: 'registered', ...entry };
}

export function describeClaim(name: string): ClaimInfo<ClaimKey> {
  return lookup(CLAIMS, name);
}

export function describeHeaderParameter(name: string): ClaimInfo<HeaderParameterKey> {
  return lookup(HEADER_PARAMETERS, name);
}
