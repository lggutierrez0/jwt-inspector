import {
  findById,
  findByRaw,
  prependRecord,
  TOKEN_SOURCE_KINDS,
  type TokenRecord,
  type VaultState,
} from './token-record';

const record = (id: string, raw = `raw-${id}`): TokenRecord => ({
  id,
  raw,
  kind: 'jws',
  label: `Label ${id}`,
  source: { kind: 'manual' },
  addedAt: 0,
});

describe('vault model', () => {
  it('lists every token source that later features produce (FR-006)', () => {
    expect(TOKEN_SOURCE_KINDS).toEqual([
      'manual',
      'created',
      'cookie',
      'localStorage',
      'sessionStorage',
      'requestHeader',
      'urlParameter',
      'body',
      'consoleLog',
    ]);
  });

  it('accepts optional context for automatic sources', () => {
    const cookie: TokenRecord = {
      ...record('c'),
      source: { kind: 'cookie', origin: 'https://app.example.test', name: 'session' },
    };

    expect(cookie.source).toEqual({
      kind: 'cookie',
      origin: 'https://app.example.test',
      name: 'session',
    });
  });

  it('prepends so the most recently added token comes first (FR-007)', () => {
    const state: VaultState = { tokens: [record('a'), record('b')] };

    expect(prependRecord(state, record('c')).tokens.map((token) => token.id)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('does not mutate the previous state', () => {
    const state: VaultState = { tokens: [record('a')] };
    prependRecord(state, record('b'));

    expect(state.tokens).toHaveLength(1);
  });

  it('finds records by raw token and by id', () => {
    const state: VaultState = { tokens: [record('a', 'x.y.z'), record('b')] };

    expect(findByRaw(state, 'x.y.z')?.id).toBe('a');
    expect(findById(state, 'b')?.raw).toBe('raw-b');
    expect(findByRaw(state, 'missing')).toBeUndefined();
    expect(findById(state, 'missing')).toBeUndefined();
  });
});
