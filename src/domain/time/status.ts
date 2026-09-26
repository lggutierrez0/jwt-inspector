import { computeLifetime } from './lifetime';
import { validAt, type TimeClaimName, type TimeClaims } from './time-claims';

export type TokenStatus = 'valid' | 'expired' | 'notYetValid' | 'neverExpires';

export type TimeWarning =
  | { readonly kind: 'invalidClaim'; readonly claim: TimeClaimName }
  | { readonly kind: 'expBeforeIat' };

export interface StatusEvaluation {
  readonly status: TokenStatus;
  /** Only on `valid`: 10% of the lifetime or 5 minutes left, whichever comes first. */
  readonly expiringSoon: boolean;
  readonly warnings: readonly TimeWarning[];
}

const SOON_MS = 5 * 60_000;
const SOON_RATIO = 0.1;
const CLAIM_ORDER: readonly TimeClaimName[] = ['iat', 'nbf', 'exp'];

function warningsFor(claims: TimeClaims): TimeWarning[] {
  const warnings: TimeWarning[] = CLAIM_ORDER.filter(
    (name) => claims[name]?.kind === 'invalid',
  ).map((claim) => ({ kind: 'invalidClaim', claim }));
  const iat = validAt(claims.iat);
  const exp = validAt(claims.exp);
  if (iat !== null && exp !== null && exp < iat) warnings.push({ kind: 'expBeforeIat' });
  return warnings;
}

function isExpiringSoon(claims: TimeClaims, exp: number, now: number): boolean {
  const remaining = exp - now;
  if (remaining <= SOON_MS) return true;
  const lifetime = computeLifetime(claims);
  return lifetime.kind === 'known' && remaining <= lifetime.total * SOON_RATIO;
}

/** Status of a token at `now`, computed only from valid time claims. */
export function evaluateStatus(claims: TimeClaims, now: number): StatusEvaluation {
  const warnings = warningsFor(claims);
  const nbf = validAt(claims.nbf);
  const exp = validAt(claims.exp);

  if (nbf !== null && now < nbf) return { status: 'notYetValid', expiringSoon: false, warnings };
  if (exp === null) return { status: 'neverExpires', expiringSoon: false, warnings };
  if (now >= exp) return { status: 'expired', expiringSoon: false, warnings };
  return { status: 'valid', expiringSoon: isExpiringSoon(claims, exp, now), warnings };
}
