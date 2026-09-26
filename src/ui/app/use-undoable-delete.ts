import { useCallback, useState, type Dispatch } from 'react';

import type { DeletedToken } from './use-vault-actions';
import type { ViewAction } from './view-reducer';

/** Remembers the last deleted token for the undo window and returns to the list (FR-018). */
export function useUndoableDelete(dispatch: Dispatch<ViewAction>) {
  const [deleted, setDeleted] = useState<DeletedToken | null>(null);
  const onDeleted = useCallback(
    (token: DeletedToken) => {
      setDeleted(token);
      dispatch({ type: 'back' });
    },
    [dispatch],
  );
  const dismiss = useCallback(() => {
    setDeleted(null);
  }, []);
  return { deleted, onDeleted, dismiss };
}
