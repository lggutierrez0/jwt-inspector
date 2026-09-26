import { defaultLabel } from './default-label';

describe('defaultLabel (FR-011)', () => {
  it.each([
    [{ name: 'María', email: 'm@example.test', sub: '1' }, 'María'],
    [{ email: 'm@example.test', sub: '1' }, 'm@example.test'],
    [{ preferred_username: 'maria', sub: '1', iss: 'auth' }, 'maria'],
    [{ sub: '8f2c-41', iss: 'auth' }, '8f2c-41'],
    [{ iss: 'auth.example.test' }, 'auth.example.test'],
  ])(
    'uses the first present claim among name, email, preferred_username, sub, iss: %j',
    (payload, label) => {
      expect(defaultLabel(payload, [])).toBe(label);
    },
  );

  it('skips empty and non-string values', () => {
    expect(defaultLabel({ name: '   ', email: 42, sub: 'real' }, [])).toBe('real');
  });

  it('trims and truncates to 60 characters', () => {
    expect(defaultLabel({ name: `  ${'x'.repeat(80)}  ` }, [])).toBe('x'.repeat(60));
  });

  it('falls back to "Token N" with the smallest unused N', () => {
    expect(defaultLabel({}, [])).toBe('Token 1');
    expect(defaultLabel({}, ['Token 1', 'Token 3', 'other'])).toBe('Token 2');
    expect(defaultLabel({}, ['Token 1', 'Token 2'])).toBe('Token 3');
  });
});
