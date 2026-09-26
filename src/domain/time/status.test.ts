import { evaluateStatus } from './status';
import type { TimeClaims } from './time-claims';

const MIN = 60_000;
const H = 60 * MIN;
const NOW = 10 * H;

const at = (ms: number) => ({ kind: 'valid', at: ms }) as const;
const claims = (partial: Partial<TimeClaims>): TimeClaims => ({
  iat: null,
  nbf: null,
  exp: null,
  ...partial,
});

describe('evaluateStatus', () => {
  it('is valid before exp', () => {
    expect(evaluateStatus(claims({ iat: at(NOW - H), exp: at(NOW + H) }), NOW)).toMatchObject({
      status: 'valid',
      expiringSoon: false,
    });
  });

  it('is expired exactly at exp', () => {
    expect(evaluateStatus(claims({ exp: at(NOW) }), NOW).status).toBe('expired');
  });

  it('is expired after exp', () => {
    expect(evaluateStatus(claims({ exp: at(NOW - 1) }), NOW).status).toBe('expired');
  });

  it('is not yet valid before nbf, even with exp in the future', () => {
    expect(evaluateStatus(claims({ nbf: at(NOW + 1), exp: at(NOW + H) }), NOW).status).toBe(
      'notYetValid',
    );
  });

  it('is valid exactly at nbf', () => {
    expect(evaluateStatus(claims({ nbf: at(NOW), exp: at(NOW + H) }), NOW).status).toBe('valid');
  });

  it('never expires without exp', () => {
    expect(evaluateStatus(claims({ iat: at(NOW - H) }), NOW)).toMatchObject({
      status: 'neverExpires',
      expiringSoon: false,
    });
  });

  it('flags expiring soon when 5 minutes or less remain', () => {
    expect(evaluateStatus(claims({ exp: at(NOW + 5 * MIN) }), NOW).expiringSoon).toBe(true);
    expect(evaluateStatus(claims({ exp: at(NOW + 5 * MIN + 1) }), NOW).expiringSoon).toBe(false);
  });

  it('flags expiring soon when 10% of the lifetime or less remains', () => {
    const tenHourLife = claims({ iat: at(NOW - 9 * H), exp: at(NOW + H) });
    const earlier = claims({ iat: at(NOW - 8 * H), exp: at(NOW + 2 * H) });

    expect(evaluateStatus(tenHourLife, NOW).expiringSoon).toBe(true);
    expect(evaluateStatus(earlier, NOW).expiringSoon).toBe(false);
  });

  it('ignores invalid claims for the status and reports them as warnings', () => {
    const result = evaluateStatus(
      claims({ exp: { kind: 'invalid', value: 'tomorrow' }, iat: { kind: 'invalid', value: -5 } }),
      NOW,
    );

    expect(result.status).toBe('neverExpires');
    expect(result.warnings).toEqual([
      { kind: 'invalidClaim', claim: 'iat' },
      { kind: 'invalidClaim', claim: 'exp' },
    ]);
  });

  it('warns when exp is before iat', () => {
    expect(evaluateStatus(claims({ iat: at(NOW), exp: at(NOW - H) }), NOW).warnings).toEqual([
      { kind: 'expBeforeIat' },
    ]);
  });
});
