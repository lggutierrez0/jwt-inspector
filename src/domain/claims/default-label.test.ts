import { defaultLabel } from './default-label';

describe('defaultLabel (FR-011)', () => {
  it.each([
    [{ preferred_username: 'maria', sub: '1', iss: 'auth' }, 'maria'],
    [{ sub: '8f2c-41', iss: 'auth' }, '8f2c-41'],
    [{ iss: 'auth.example.test' }, 'auth.example.test'],
  ])('uses the first present claim among preferred_username, sub, iss: %j', (payload, label) => {
    expect(defaultLabel(payload, [])).toBe(label);
  });

  it('never derives a label from personal data, which is masked (constitution III, FR-015)', () => {
    expect(defaultLabel({ name: 'María', email: 'm@example.test', sub: 'u-17' }, [])).toBe('u-17');
    expect(defaultLabel({ email: 'm@example.test', phone_number: '+1 555' }, [])).toBe('Token 1');
  });

  it('skips empty and non-string values', () => {
    expect(defaultLabel({ preferred_username: '   ', sub: 42, iss: 'real' }, [])).toBe('real');
  });

  it('trims and truncates to 60 characters', () => {
    expect(defaultLabel({ sub: `  ${'x'.repeat(80)}  ` }, [])).toBe('x'.repeat(60));
  });

  it('falls back to "Token N" with the smallest unused N', () => {
    expect(defaultLabel({}, [])).toBe('Token 1');
    expect(defaultLabel({}, ['Token 1', 'Token 3', 'other'])).toBe('Token 2');
    expect(defaultLabel({}, ['Token 1', 'Token 2'])).toBe('Token 3');
  });
});
