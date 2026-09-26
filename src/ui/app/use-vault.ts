import { useCallback, useEffect, useState } from 'react';

import type { VaultState } from '@/domain/vault/token-record';

import { useServices } from './services-context';

type VaultStatus =
  | { readonly status: 'loading' }
  | { readonly status: 'error' }
  | { readonly status: 'ready'; readonly state: VaultState; readonly droppedCount: number };

export type VaultView = VaultStatus & { readonly acknowledgeDropped: () => void };

/** The vault as the UI sees it: loaded once, then kept in sync with every panel (FR-022). */
export function useVault(): VaultView {
  const { repository } = useServices();
  const [status, setStatus] = useState<VaultStatus>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    const unsubscribe = repository.subscribe((state) => {
      setStatus((current) => ({
        status: 'ready',
        state,
        droppedCount: current.status === 'ready' ? current.droppedCount : 0,
      }));
    });
    const load = async () => {
      try {
        const { state, droppedCount } = await repository.load();
        if (active) setStatus({ status: 'ready', state, droppedCount });
      } catch {
        if (active) setStatus({ status: 'error' });
      }
    };
    void load();
    return () => {
      active = false;
      unsubscribe();
    };
  }, [repository]);

  const acknowledgeDropped = useCallback(() => {
    setStatus((current) =>
      current.status === 'ready' ? { ...current, droppedCount: 0 } : current,
    );
  }, []);

  return { ...status, acknowledgeDropped };
}
