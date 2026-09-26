import { expired3d, jwe5Parts, NOW, noExp, valid1h } from '../../../tests/fixtures/tokens';
import { isRecordExpired, recordExpiry } from './expiry';

describe('isRecordExpired', () => {
  it.each([
    [expired3d, true],
    [valid1h, false],
    [noExp, false],
    [jwe5Parts, false],
    ['not.a.token', false],
  ])('%#', (raw, expected) => {
    expect(isRecordExpired({ raw }, NOW)).toBe(expected);
  });
});

describe('recordExpiry', () => {
  it.each([
    [expired3d, NOW - 3 * 86_400_000],
    [noExp, null],
    [jwe5Parts, null],
  ])('%#', (raw, expected) => {
    expect(recordExpiry({ raw })).toBe(expected);
  });
});
