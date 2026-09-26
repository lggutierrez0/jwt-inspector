import { validateLabel } from './label';

describe('validateLabel (FR-017)', () => {
  it('accepts and trims a label of 1 to 60 characters', () => {
    expect(validateLabel('  Checkout  ')).toEqual({ ok: true, label: 'Checkout' });
    expect(validateLabel('x'.repeat(60))).toEqual({ ok: true, label: 'x'.repeat(60) });
  });

  it('rejects a label that is empty after trimming', () => {
    expect(validateLabel('   ')).toEqual({ ok: false, reason: 'empty' });
  });

  it('rejects a label longer than 60 characters after trimming', () => {
    expect(validateLabel(` ${'x'.repeat(61)} `)).toEqual({ ok: false, reason: 'tooLong' });
  });
});
