import { act, waitFor } from '@testing-library/react';

import type { TokenRecord } from '@/domain/vault/token-record';

import { InMemoryVaultRepository } from '../../../tests/support/in-memory-ports';
import { renderHookWithProviders } from '../../../tests/support/render';
import { useVault } from './use-vault';

const record = (id: string): TokenRecord => ({
  id,
  raw: `h.${id}.s`,
  kind: 'jws',
  label: id,
  source: { kind: 'manual' },
  addedAt: 0,
});

describe('useVault', () => {
  it('starts loading, then exposes the stored vault', async () => {
    const repository = new InMemoryVaultRepository({ tokens: [record('a')] });
    const { result } = renderHookWithProviders(() => useVault(), { repository });

    expect(result.current.status).toBe('loading');
    await waitFor(() => {
      expect(result.current).toMatchObject({ status: 'ready', state: { tokens: [record('a')] } });
    });
  });

  it('loads only once', async () => {
    const repository = new InMemoryVaultRepository();
    const load = vi.spyOn(repository, 'load');
    const { result, rerender } = renderHookWithProviders(() => useVault(), { repository });
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    rerender();

    expect(load).toHaveBeenCalledTimes(1);
  });

  it('re-renders when another panel changes the vault (FR-022)', async () => {
    const repository = new InMemoryVaultRepository();
    const { result } = renderHookWithProviders(() => useVault(), { repository });
    await waitFor(() => {
      expect(result.current.status).toBe('ready');
    });

    act(() => {
      repository.externalWrite({ tokens: [record('b')] });
    });

    expect(result.current).toMatchObject({ status: 'ready', state: { tokens: [record('b')] } });
  });

  it('surfaces dropped records until acknowledged', async () => {
    const repository = new InMemoryVaultRepository();
    repository.droppedCount = 2;
    const { result } = renderHookWithProviders(() => useVault(), { repository });
    await waitFor(() => {
      expect(result.current).toMatchObject({ status: 'ready', droppedCount: 2 });
    });

    act(() => {
      result.current.acknowledgeDropped();
    });

    expect(result.current).toMatchObject({ droppedCount: 0 });
  });

  it('reports an error when the vault cannot be read', async () => {
    const repository = new InMemoryVaultRepository();
    vi.spyOn(repository, 'load').mockRejectedValue(new Error('storage unavailable'));
    const { result } = renderHookWithProviders(() => useVault(), { repository });

    await waitFor(() => {
      expect(result.current.status).toBe('error');
    });
  });
});
