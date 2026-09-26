import { fakeBrowser } from 'wxt/testing/fake-browser';

import type { TokenRecord, VaultState } from '@/domain/vault/token-record';

import { BrowserVaultRepository } from './browser-vault-repository';

const record = (id: string): TokenRecord => ({
  id,
  raw: `h.${id}.s`,
  kind: 'jws',
  label: `Token ${id}`,
  source: { kind: 'manual' },
  addedAt: 1,
});
const vault = (...ids: string[]): VaultState => ({ tokens: ids.map((id) => record(id)) });

describe('BrowserVaultRepository (FR-020, FR-022)', () => {
  it('loads an empty vault when nothing is stored', async () => {
    await expect(new BrowserVaultRepository().load()).resolves.toEqual({
      state: { tokens: [] },
      droppedCount: 0,
    });
  });

  it('round-trips a vault through extension-local storage', async () => {
    const repository = new BrowserVaultRepository();

    await expect(repository.save(vault('a', 'b'))).resolves.toEqual({ ok: true });
    await expect(repository.load()).resolves.toEqual({ state: vault('a', 'b'), droppedCount: 0 });
    await expect(fakeBrowser.storage.local.get('vault')).resolves.toEqual({
      vault: vault('a', 'b'),
    });
  });

  it('parses stored data and never rewrites storage on read', async () => {
    const stored = { tokens: [record('a'), { ...record('b'), secret: 'x' }] };
    await fakeBrowser.storage.local.set({ vault: stored });
    const setSpy = vi.spyOn(fakeBrowser.storage.local, 'set');

    await expect(new BrowserVaultRepository().load()).resolves.toEqual({
      state: vault('a'),
      droppedCount: 1,
    });
    expect(setSpy).not.toHaveBeenCalled();
  });

  it('reports a quota failure as a value', async () => {
    vi.spyOn(fakeBrowser.storage.local, 'set').mockRejectedValue(
      new Error('QUOTA_BYTES quota exceeded'),
    );

    await expect(new BrowserVaultRepository().save(vault('a'))).resolves.toEqual({
      ok: false,
      reason: 'quota',
    });
  });

  it('reports any other storage failure as unknown', async () => {
    vi.spyOn(fakeBrowser.storage.local, 'set').mockRejectedValue(new Error('disk on fire'));

    await expect(new BrowserVaultRepository().save(vault('a'))).resolves.toEqual({
      ok: false,
      reason: 'unknown',
    });
  });

  it('notifies subscribers with parsed state when another page writes the vault', async () => {
    const listener = vi.fn<(state: VaultState) => void>();
    const unsubscribe = new BrowserVaultRepository().subscribe(listener);

    await fakeBrowser.storage.local.set({ vault: vault('x') });
    await vi.waitFor(() => {
      expect(listener).toHaveBeenCalledWith(vault('x'));
    });

    unsubscribe();
    await fakeBrowser.storage.local.set({ vault: vault('y') });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('never writes to synced storage', async () => {
    await new BrowserVaultRepository().save(vault('a'));

    await expect(fakeBrowser.storage.sync.get()).resolves.toEqual({});
  });
});
