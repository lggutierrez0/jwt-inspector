import { CryptoIdGenerator } from './crypto-id-generator';

describe('CryptoIdGenerator', () => {
  it('returns unique RFC 4122 v4 ids', () => {
    const generator = new CryptoIdGenerator();
    const ids = new Set(Array.from({ length: 50 }, () => generator.next()));

    expect(ids.size).toBe(50);
    for (const id of ids)
      expect(id).toMatch(/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/u);
  });
});
