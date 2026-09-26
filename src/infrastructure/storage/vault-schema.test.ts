import { parseVault } from './vault-schema';

const record = (overrides: Record<string, unknown> = {}) => ({
  id: '0b6f3c1e-8a52-4d0e-9d7a-2f4c1f5e9a10',
  raw: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.c2ln',
  kind: 'jws',
  label: '123',
  source: { kind: 'manual' },
  addedAt: 1_790_380_800_000,
  ...overrides,
});

describe('parseVault (contracts/storage-vault-v1.md)', () => {
  it('accepts the contract example document', () => {
    const document = { tokens: [record()] };

    expect(parseVault(document)).toEqual({ state: document, droppedCount: 0 });
  });

  it.each([null, undefined])('falls back to an empty vault for a missing item (%s)', (value) => {
    expect(parseVault(value)).toEqual({ state: { tokens: [] }, droppedCount: 0 });
  });

  it('treats a document that is not a vault as empty and counts nothing to keep', () => {
    expect(parseVault({ tokens: 'nope' })).toEqual({ state: { tokens: [] }, droppedCount: 0 });
  });

  it.each([
    ['empty raw', { raw: '' }],
    ['raw over 64 KiB', { raw: 'a'.repeat(64 * 1024 + 1) }],
    ['empty id', { id: '' }],
    ['blank label', { label: '   ' }],
    ['label over 60 chars', { label: 'x'.repeat(61) }],
    ['unknown kind', { kind: 'jwt' }],
    ['negative addedAt', { addedAt: -1 }],
    ['non-finite addedAt', { addedAt: Number.POSITIVE_INFINITY }],
    ['unknown source kind', { source: { kind: 'clipboard' } }],
    ['non-string source context', { source: { kind: 'cookie', name: 42 } }],
    ['unknown record field (FR-021: no secrets)', { secret: 'hunter2' }],
    ['unknown source field', { source: { kind: 'manual', password: 'x' } }],
  ])('drops a record with %s and reports it', (_name, overrides) => {
    const kept = record({ id: 'keep', raw: 'a.b.c' });

    expect(parseVault({ tokens: [record(overrides), kept] })).toEqual({
      state: { tokens: [kept] },
      droppedCount: 1,
    });
  });

  it('accepts context fields on automatic sources', () => {
    const cookie = record({
      source: { kind: 'cookie', origin: 'https://app.example.test', name: 'sid' },
    });

    expect(parseVault({ tokens: [cookie] }).state.tokens).toEqual([cookie]);
  });

  it('keeps the first occurrence of a duplicate id or raw token', () => {
    const first = record({ id: 'a', raw: 'x.y.z' });
    const sameId = record({ id: 'a', raw: 'other.raw.token' });
    const sameRaw = record({ id: 'b', raw: 'x.y.z' });

    expect(parseVault({ tokens: [first, sameId, sameRaw] })).toEqual({
      state: { tokens: [first] },
      droppedCount: 2,
    });
  });

  it('accepts a label of exactly 60 characters after trimming', () => {
    const label = `  ${'x'.repeat(60)}  `;

    expect(parseVault({ tokens: [record({ label })] }).droppedCount).toBe(0);
  });
});
