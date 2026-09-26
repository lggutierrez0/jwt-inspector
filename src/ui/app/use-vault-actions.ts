import { useMemo } from 'react';

import { clearAll } from '@/application/vault/clear-all';
import { clearExpired } from '@/application/vault/clear-expired';
import { deleteToken } from '@/application/vault/delete-token';
import { renameToken } from '@/application/vault/rename-token';
import { restoreToken } from '@/application/vault/restore-token';
import type { TokenRecord } from '@/domain/vault/token-record';

import { useI18n } from '../i18n/i18n-context';
import type { ActionOutcome } from './action-outcome';
import { useServices } from './services-context';

export interface DeletedToken {
  readonly record: TokenRecord;
  readonly index: number;
}

/** Vault use cases with their results translated into what the UI shows (US4). */
export function useVaultActions(onDeleted: (deleted: DeletedToken) => void) {
  const { t } = useI18n();
  const services = useServices();

  return useMemo(() => {
    const failed: ActionOutcome = { ok: false, message: t('remove.failed') };
    const done: ActionOutcome = { ok: true };
    return {
      rename: async (id: string, label: string): Promise<ActionOutcome> => {
        const result = await renameToken(id, label, services);
        if (result.kind === 'invalidLabel') {
          return { ok: false, message: t(`label.errors.${result.reason}`) };
        }
        return result.kind === 'saveFailed'
          ? { ok: false, message: t('label.errors.saveFailed') }
          : done;
      },
      remove: async (id: string): Promise<ActionOutcome> => {
        const result = await deleteToken(id, services);
        if (result.kind === 'saveFailed') return failed;
        if (result.kind === 'deleted') onDeleted({ record: result.record, index: result.index });
        return done;
      },
      restore: async ({ record, index }: DeletedToken): Promise<void> => {
        await restoreToken(record, index, services);
      },
      clearAll: async (): Promise<ActionOutcome> =>
        (await clearAll(services)).kind === 'cleared' ? done : failed,
      clearExpired: async (): Promise<ActionOutcome> =>
        (await clearExpired(services.clock.now(), services)).kind === 'cleared' ? done : failed,
    };
  }, [t, services, onDeleted]);
}
