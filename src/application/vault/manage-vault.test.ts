import type { TokenRecord, VaultState } from '@/domain/vault/token-record';

import { expired3d, NOW, noExp, valid1h } from '../../../tests/fixtures/tokens';
import { InMemoryVaultRepository } from '../../../tests/support/in-memory-ports';
import { clearAll } from './clear-all';
import { clearExpired } from './clear-expired';
import { deleteToken } from './delete-token';
import { renameToken } from './rename-token';
import { restoreToken } from './restore-token';

const record = (id: string, raw: string): TokenRecord => ({
  id,
  raw,
  kind: 'jws',
  label: `Label ${id}`,
  source: { kind: 'manual' },
  addedAt: 0,
});
const a = record('a', valid1h);
const b = record('b', expired3d);
const c = record('c', noExp);
const vault = (...tokens: TokenRecord[]): VaultState => ({ tokens });

describe('renameToken', () => {
  it('renames with the trimmed label', async () => {
    const repository = new InMemoryVaultRepository(vault(a, b));

    await expect(renameToken('b', '  Staging  ', { repository })).resolves.toEqual({
      kind: 'renamed',
    });
    expect(repository.state.tokens[1]?.label).toBe('Staging');
  });

  it('rejects an invalid label without saving', async () => {
    const repository = new InMemoryVaultRepository(vault(a));

    await expect(renameToken('a', ' ', { repository })).resolves.toEqual({
      kind: 'invalidLabel',
      reason: 'empty',
    });
    expect(repository.saves).toBe(0);
  });

  it('reports a missing token and a storage failure', async () => {
    const repository = new InMemoryVaultRepository(vault(a));

    await expect(renameToken('zzz', 'x', { repository })).resolves.toEqual({ kind: 'notFound' });
    repository.failNextSave = { ok: false, reason: 'unknown' };
    await expect(renameToken('a', 'x', { repository })).resolves.toEqual({ kind: 'saveFailed' });
  });
});

describe('deleteToken and restoreToken (FR-018)', () => {
  it('deletes and returns what undo needs', async () => {
    const repository = new InMemoryVaultRepository(vault(a, b, c));

    await expect(deleteToken('b', { repository })).resolves.toEqual({
      kind: 'deleted',
      record: b,
      index: 1,
    });
    expect(repository.state.tokens.map((token) => token.id)).toEqual(['a', 'c']);
  });

  it('restores at the original position', async () => {
    const repository = new InMemoryVaultRepository(vault(a, c));

    await expect(restoreToken(b, 1, { repository })).resolves.toEqual({ kind: 'restored' });
    expect(repository.state.tokens.map((token) => token.id)).toEqual(['a', 'b', 'c']);
  });

  it('restores at the end when the list got shorter meanwhile', async () => {
    const repository = new InMemoryVaultRepository(vault(a));

    await restoreToken(c, 5, { repository });

    expect(repository.state.tokens.map((token) => token.id)).toEqual(['a', 'c']);
  });

  it('does not restore a token that is already back', async () => {
    const repository = new InMemoryVaultRepository(vault(a, b));

    await expect(restoreToken(b, 1, { repository })).resolves.toEqual({ kind: 'duplicate' });
  });

  it('reports a missing token and storage failures', async () => {
    const repository = new InMemoryVaultRepository(vault(a));

    await expect(deleteToken('zzz', { repository })).resolves.toEqual({ kind: 'notFound' });
    repository.failNextSave = { ok: false, reason: 'quota' };
    await expect(deleteToken('a', { repository })).resolves.toEqual({ kind: 'saveFailed' });
    repository.failNextSave = { ok: false, reason: 'quota' };
    await expect(restoreToken(b, 0, { repository })).resolves.toEqual({ kind: 'saveFailed' });
  });
});

describe('clearAll (FR-019)', () => {
  it('removes every token and reports how many', async () => {
    const repository = new InMemoryVaultRepository(vault(a, b, c));

    await expect(clearAll({ repository })).resolves.toEqual({ kind: 'cleared', count: 3 });
    expect(repository.state.tokens).toEqual([]);
  });

  it('reports a storage failure', async () => {
    const repository = new InMemoryVaultRepository(vault(a));
    repository.failNextSave = { ok: false, reason: 'unknown' };

    await expect(clearAll({ repository })).resolves.toEqual({ kind: 'saveFailed' });
  });
});

describe('clearExpired (FR-023)', () => {
  it('removes only expired tokens and keeps order', async () => {
    const jwe = { ...record('d', 'h.e.k.i.t'), kind: 'jwe' as const };
    const repository = new InMemoryVaultRepository(vault(a, b, c, jwe));

    await expect(clearExpired(NOW, { repository })).resolves.toEqual({ kind: 'cleared', count: 1 });
    expect(repository.state.tokens.map((token) => token.id)).toEqual(['a', 'c', 'd']);
  });

  it('does not write when nothing is expired', async () => {
    const repository = new InMemoryVaultRepository(vault(a, c));

    await expect(clearExpired(NOW, { repository })).resolves.toEqual({ kind: 'cleared', count: 0 });
    expect(repository.saves).toBe(0);
  });

  it('reports a storage failure', async () => {
    const repository = new InMemoryVaultRepository(vault(b));
    repository.failNextSave = { ok: false, reason: 'unknown' };

    await expect(clearExpired(NOW, { repository })).resolves.toEqual({ kind: 'saveFailed' });
  });
});
