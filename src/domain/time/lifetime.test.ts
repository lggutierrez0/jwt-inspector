import { computeLifetime, consumedRatio, splitDuration } from './lifetime';
import type { TimeClaims } from './time-claims';

const S = 1000;
const MIN = 60 * S;
const H = 60 * MIN;
const D = 24 * H;

const at = (ms: number) => ({ kind: 'valid', at: ms }) as const;
const claims = (partial: Partial<TimeClaims>): TimeClaims => ({
  iat: null,
  nbf: null,
  exp: null,
  ...partial,
});

describe('computeLifetime (FR-009)', () => {
  it('uses exp - iat', () => {
    expect(computeLifetime(claims({ iat: at(0), nbf: at(H), exp: at(3 * H) }))).toEqual({
      kind: 'known',
      start: 0,
      end: 3 * H,
      total: 3 * H,
    });
  });

  it('falls back to exp - nbf when iat is absent', () => {
    expect(computeLifetime(claims({ nbf: at(H), exp: at(3 * H) }))).toEqual({
      kind: 'known',
      start: H,
      end: 3 * H,
      total: 2 * H,
    });
  });

  it('is unknown when neither iat nor nbf is present', () => {
    expect(computeLifetime(claims({ exp: at(H) }))).toEqual({ kind: 'unknown' });
  });

  it('is none without exp', () => {
    expect(computeLifetime(claims({ iat: at(0) }))).toEqual({ kind: 'none' });
  });

  it('is unknown when exp is not after the start', () => {
    expect(computeLifetime(claims({ iat: at(H), exp: at(0) }))).toEqual({ kind: 'unknown' });
  });

  it('ignores invalid claims', () => {
    expect(computeLifetime(claims({ iat: { kind: 'invalid', value: 'x' }, exp: at(H) }))).toEqual({
      kind: 'unknown',
    });
  });
});

describe('consumedRatio', () => {
  const life = { kind: 'known', start: 0, end: 10 * H, total: 10 * H } as const;

  it.each([
    [-H, 0],
    [0, 0],
    [2.5 * H, 0.25],
    [10 * H, 1],
    [20 * H, 1],
  ])('at %d ms is %d', (now, ratio) => {
    expect(consumedRatio(life, now)).toBe(ratio);
  });
});

describe('splitDuration', () => {
  it.each([
    [0, [{ value: 0, unit: 's' }]],
    [42 * S, [{ value: 42, unit: 's' }]],
    [
      3 * MIN + 5 * S,
      [
        { value: 3, unit: 'min' },
        { value: 5, unit: 's' },
      ],
    ],
    [
      2 * H + 14 * MIN + 59 * S,
      [
        { value: 2, unit: 'h' },
        { value: 14, unit: 'min' },
      ],
    ],
    [
      3 * D + 4 * H,
      [
        { value: 3, unit: 'd' },
        { value: 4, unit: 'h' },
      ],
    ],
    [2 * H, [{ value: 2, unit: 'h' }]],
  ])('%d ms -> %j (largest two non-zero units)', (ms, parts) => {
    expect(splitDuration(ms)).toEqual(parts);
  });

  it('uses the absolute value for past durations', () => {
    expect(splitDuration(-90 * S)).toEqual([
      { value: 1, unit: 'min' },
      { value: 30, unit: 's' },
    ]);
  });
});
