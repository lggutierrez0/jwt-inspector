import { describeClaim, describeHeaderParameter } from './claim-catalog';

describe('claim catalog (FR-014)', () => {
  it.each([
    ['iss', '4.1.1'],
    ['sub', '4.1.2'],
    ['aud', '4.1.3'],
    ['exp', '4.1.4'],
    ['nbf', '4.1.5'],
    ['iat', '4.1.6'],
    ['jti', '4.1.7'],
  ])('describes registered claim %s with RFC 7519 section %s', (name, section) => {
    expect(describeClaim(name)).toEqual({
      kind: 'registered',
      key: name,
      citation: `RFC 7519, Section ${section}`,
    });
  });

  it.each([
    ['alg', 'alg', '4.1.1'],
    ['jku', 'jku', '4.1.2'],
    ['jwk', 'jwk', '4.1.3'],
    ['kid', 'kid', '4.1.4'],
    ['x5u', 'x5u', '4.1.5'],
    ['x5c', 'x5c', '4.1.6'],
    ['x5t', 'x5t', '4.1.7'],
    ['x5t#S256', 'x5tS256', '4.1.8'],
    ['typ', 'typ', '4.1.9'],
    ['cty', 'cty', '4.1.10'],
    ['crit', 'crit', '4.1.11'],
  ])('describes header parameter %s with RFC 7515 section %s', (name, key, section) => {
    expect(describeHeaderParameter(name)).toEqual({
      kind: 'registered',
      key,
      citation: `RFC 7515, Section ${section}`,
    });
  });

  it.each(['email', 'name', 'given_name', 'family_name', 'phone_number', 'birthdate'])(
    'cites OpenID Connect for the standard personal claim %s',
    (name) => {
      expect(describeClaim(name)).toMatchObject({
        kind: 'registered',
        citation: 'OpenID Connect Core 1.0, Section 5.1',
      });
    },
  );

  it('reports unknown names as custom', () => {
    expect(describeClaim('roles')).toEqual({ kind: 'custom' });
    expect(describeHeaderParameter('foo')).toEqual({ kind: 'custom' });
  });

  it('does not treat inherited object properties as claims', () => {
    expect(describeClaim('toString')).toEqual({ kind: 'custom' });
  });
});
