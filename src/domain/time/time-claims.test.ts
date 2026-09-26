import { readTimeClaims } from './time-claims';

describe('readTimeClaims', () => {
  it('reads NumericDate seconds as epoch milliseconds, fractions allowed', () => {
    expect(
      readTimeClaims({ iat: 1_790_000_000, nbf: 1_790_000_000.5, exp: 1_790_003_600 }),
    ).toEqual({
      iat: { kind: 'valid', at: 1_790_000_000_000 },
      nbf: { kind: 'valid', at: 1_790_000_000_500 },
      exp: { kind: 'valid', at: 1_790_003_600_000 },
    });
  });

  it('returns null for absent claims', () => {
    expect(readTimeClaims({ sub: 'x' })).toEqual({ iat: null, nbf: null, exp: null });
  });

  it.each([['tomorrow'], [-5], [true], [null], [{ at: 1 }]])(
    'keeps the original value of an invalid claim: %j',
    (value) => {
      expect(readTimeClaims({ exp: value }).exp).toEqual({ kind: 'invalid', value });
    },
  );

  it('treats zero as a valid instant (the epoch)', () => {
    expect(readTimeClaims({ iat: 0 }).iat).toEqual({ kind: 'valid', at: 0 });
  });
});
