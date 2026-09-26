import { validAt, type TimeClaims } from './time-claims';

export type Lifetime =
  | { readonly kind: 'known'; readonly start: number; readonly end: number; readonly total: number }
  | { readonly kind: 'unknown' }
  | { readonly kind: 'none' };

/** Total lifetime: exp - iat, else exp - nbf (FR-009). */
export function computeLifetime(claims: TimeClaims): Lifetime {
  const end = validAt(claims.exp);
  if (end === null) return { kind: 'none' };
  const start = validAt(claims.iat) ?? validAt(claims.nbf);
  if (start === null || end <= start) return { kind: 'unknown' };
  return { kind: 'known', start, end, total: end - start };
}

/** Portion of the lifetime already consumed, clamped to [0, 1]. */
export function consumedRatio(lifetime: Extract<Lifetime, { kind: 'known' }>, now: number): number {
  return Math.min(1, Math.max(0, (now - lifetime.start) / lifetime.total));
}

export type DurationUnit = 'd' | 'h' | 'min' | 's';
export interface DurationPart {
  readonly value: number;
  readonly unit: DurationUnit;
}

const UNITS: readonly (readonly [DurationUnit, number])[] = [
  ['d', 86_400_000],
  ['h', 3_600_000],
  ['min', 60_000],
  ['s', 1000],
];

/** The two largest non-zero units of a duration, for display ("2 h 14 min"). */
export function splitDuration(ms: number): DurationPart[] {
  let rest = Math.floor(Math.abs(ms) / 1000) * 1000;
  const parts: DurationPart[] = [];
  for (const [unit, size] of UNITS) {
    const value = Math.floor(rest / size);
    rest -= value * size;
    if (value > 0 || parts.length > 0) parts.push({ value, unit });
  }
  const significant = parts.slice(0, 2).filter((part, index) => index === 0 || part.value > 0);
  return significant.length > 0 ? significant : [{ value: 0, unit: 's' }];
}
