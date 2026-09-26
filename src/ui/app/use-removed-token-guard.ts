import { useEffect, useRef, type Dispatch } from 'react';

import type { TokenRecord } from '@/domain/vault/token-record';

import type { VaultView } from './use-vault';
import type { Screen, ViewAction } from './view-reducer';

/**
 * Leaves a detail whose token another panel removed (data-model transitions). Only a token that
 * was already shown can disappear: a just-saved one may not have arrived yet, because storage
 * change events are delivered after the write resolves.
 */
export function useRemovedTokenGuard(
  vault: VaultView,
  screen: Screen,
  openRecord: TokenRecord | undefined,
  dispatch: Dispatch<ViewAction>,
): void {
  const shownId = useRef<string | null>(null);
  useEffect(() => {
    if (screen.name !== 'detail') return;
    if (openRecord !== undefined) {
      shownId.current = openRecord.id;
    } else if (vault.status === 'ready' && shownId.current === screen.id) {
      shownId.current = null;
      dispatch({ type: 'tokenRemovedExternally', id: screen.id });
    }
  }, [vault.status, screen, openRecord, dispatch]);
}
