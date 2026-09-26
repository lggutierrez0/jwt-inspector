import type { JsonObject, JsonValue } from '../jwt/types';

export type TimeClaim =
  | {
      readonly kind: 'valid';
      /** Epoch milliseconds. */
      readonly at: number;
    }
  | { readonly kind: 'invalid'; readonly value: JsonValue };

export type TimeClaimName = 'iat' | 'nbf' | 'exp';

export type TimeClaims = Readonly<Record<TimeClaimName, TimeClaim | null>>;

function readClaim(payload: JsonObject, name: TimeClaimName): TimeClaim | null {
  if (!Object.hasOwn(payload, name)) return null;
  const value = payload[name] ?? null;
  const isNumericDate = typeof value === 'number' && Number.isFinite(value) && value >= 0;
  return isNumericDate ? { kind: 'valid', at: value * 1000 } : { kind: 'invalid', value };
}

/** Reads the registered time claims (RFC 7519 NumericDate, seconds) as epoch milliseconds. */
export function readTimeClaims(payload: JsonObject): TimeClaims {
  return {
    iat: readClaim(payload, 'iat'),
    nbf: readClaim(payload, 'nbf'),
    exp: readClaim(payload, 'exp'),
  };
}

/** The instant of a claim when it is present and valid. */
export function validAt(claim: TimeClaim | null): number | null {
  return claim?.kind === 'valid' ? claim.at : null;
}
