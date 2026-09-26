import { useMemo, useState } from 'react';

import { recordExpiry } from '@/domain/vault/expiry';
import type { TokenRecord } from '@/domain/vault/token-record';

import type { ActionOutcome } from '../app/action-outcome';
import { useNow } from '../clock/use-now';
import { useI18n } from '../i18n/i18n-context';
import { Command } from './command';
import { ConfirmDialog } from './confirm-dialog';

interface ListToolbarProps {
  readonly tokens: readonly TokenRecord[];
  readonly onClearAll: () => Promise<ActionOutcome>;
  readonly onClearExpired: () => Promise<ActionOutcome>;
}

/**
 * Count and bulk removal. Follows the clock itself (to know what is expired) so the list does
 * not re-render every second.
 */
export function ListToolbar({ tokens, onClearAll, onClearExpired }: ListToolbarProps) {
  const { t } = useI18n();
  const now = useNow();
  const [confirming, setConfirming] = useState<'all' | 'expired' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const expiries = useMemo(() => tokens.map((token) => recordExpiry(token)), [tokens]);
  const expiredCount = expiries.filter((expiry) => expiry !== null && now >= expiry).length;

  const run = async (action: () => Promise<ActionOutcome>) => {
    setConfirming(null);
    const outcome = await action();
    setError(outcome.ok ? null : outcome.message);
  };

  return (
    <div className="flex flex-col gap-1 border-b border-line px-3 py-2 wide:px-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-cite text-ink-muted">{t('list.count', tokens.length)}</span>
        <span className="flex gap-3">
          {expiredCount > 0 && (
            <Command
              tone="danger"
              label={t('remove.clearExpired')}
              onClick={() => {
                setConfirming('expired');
              }}
            />
          )}
          <Command
            tone="danger"
            label={t('remove.clearAll')}
            onClick={() => {
              setConfirming('all');
            }}
          />
        </span>
      </div>
      {error !== null && (
        <p role="alert" className="text-status-expired">
          {error}
        </p>
      )}
      {confirming !== null && (
        <ConfirmDialog
          title={
            confirming === 'all'
              ? t('remove.confirmAll', tokens.length)
              : t('remove.confirmExpired', expiredCount)
          }
          onConfirm={() => {
            void run(confirming === 'all' ? onClearAll : onClearExpired);
          }}
          onCancel={() => {
            setConfirming(null);
          }}
        />
      )}
    </div>
  );
}
