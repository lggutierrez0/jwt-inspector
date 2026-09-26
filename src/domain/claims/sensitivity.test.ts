import { isSensitiveClaim, MASKED, redactSensitive } from './sensitivity';

describe('isSensitiveClaim (FR-015)', () => {
  it.each([
    'email',
    'name',
    'given_name',
    'family_name',
    'middle_name',
    'nickname',
    'phone_number',
    'address',
    'birthdate',
  ])('masks the personal-data claim %s', (claim) => {
    expect(isSensitiveClaim([claim])).toBe(true);
  });

  it.each([
    ['password'],
    ['client_secret'],
    ['refresh_token'],
    ['apiKey'],
    ['credentials', 'apiKey'],
    ['SECRET'],
    ['vault', 'Token'],
  ])('masks any segment containing password, secret, token or key: %j', (...path) => {
    expect(isSensitiveClaim(path)).toBe(true);
  });

  it('masks every value nested under a secret-looking parent', () => {
    expect(isSensitiveClaim(['keys', 'primary'])).toBe(true);
  });

  it.each([['sub'], ['iss'], ['exp'], ['roles'], ['credentials', 'scope'], ['address_verified']])(
    'does not mask %j',
    (...path) => {
      expect(isSensitiveClaim(path)).toBe(false);
    },
  );

  it('matches personal-data claims only as the last segment', () => {
    expect(isSensitiveClaim(['name', 'format'])).toBe(false);
  });
});

describe('redactSensitive', () => {
  it('replaces sensitive leaves with the masked marker and reports it', () => {
    expect(
      redactSensitive(
        { sub: 'u', email: 'a@b.test', credentials: { apiKey: 'k', scope: 'read' } },
        [],
      ),
    ).toEqual({
      value: { sub: 'u', email: MASKED, credentials: { apiKey: MASKED, scope: 'read' } },
      redacted: true,
    });
  });

  it('masks the whole value when its own path is sensitive', () => {
    expect(redactSensitive({ a: 1 }, ['client_secret'])).toEqual({ value: MASKED, redacted: true });
  });

  it('walks arrays without treating indexes as names', () => {
    expect(redactSensitive([{ token: 't' }, { ok: 1 }], ['items'])).toEqual({
      value: [{ token: MASKED }, { ok: 1 }],
      redacted: true,
    });
  });

  it('returns the value untouched when nothing is sensitive', () => {
    const value = { sub: 'u', roles: ['a'] };

    expect(redactSensitive(value, [])).toEqual({ value, redacted: false });
  });
});
