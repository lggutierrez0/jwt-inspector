import { isSensitiveClaim } from './sensitivity';

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
