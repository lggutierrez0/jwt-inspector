import { useMemo, useState } from 'react';

import type { SupportedLocale } from '@/application/ports/locale-preference-repository';
import { isRecordExpired } from '@/domain/vault/expiry';
import type { TokenRecord } from '@/domain/vault/token-record';

import type { ActionOutcome } from '../app/action-outcome';
import { buildNavCommands } from '../app/nav-commands';
import type { Screen } from '../app/view-reducer';
import { useNow } from '../clock/use-now';
import { useI18n } from '../i18n/i18n-context';
import { Command } from './command';
import { ConfirmDialog } from './confirm-dialog';

interface CommandBarProps {
  readonly screen: Screen['name'];
  readonly tokens: readonly TokenRecord[];
  readonly onAdd: () => void;
  readonly onInfo: () => void;
  readonly onClearAll: () => Promise<ActionOutcome>;
  readonly onClearExpired: () => Promise<ActionOutcome>;
}

const LOCALE_LABEL: Record<SupportedLocale, string> = { en: 'EN', es: 'ES' };
const OTHER_LOCALE: Record<SupportedLocale, SupportedLocale> = { en: 'es', es: 'en' };
const SWITCH_TO_KEY: Record<
  SupportedLocale,
  'language.switchToEnglish' | 'language.switchToSpanish'
> = {
  en: 'language.switchToSpanish',
  es: 'language.switchToEnglish',
};

/**
 * The persistent command bar (FR-027, DESIGN.md "Command bar"): present under the title on
 * every screen. Follows the clock itself (to know what is expired) so it does not re-render
 * every second.
 */
export function CommandBar({
  screen,
  tokens,
  onAdd,
  onInfo,
  onClearAll,
  onClearExpired,
}: CommandBarProps) {
  const { t, locale, setLocale } = useI18n();
  const now = useNow();
  const [confirming, setConfirming] = useState<'all' | 'expired' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const expiredCount = useMemo(
    () => tokens.filter((token) => isRecordExpired(token, now)).length,
    [tokens, now],
  );
  const currentLocale: SupportedLocale = locale === 'es' ? 'es' : 'en';
  const nextLocale = OTHER_LOCALE[currentLocale];

  const commands = buildNavCommands({
    screen,
    tokenCount: tokens.length,
    expiredCount,
    t,
    onAdd,
    onInfo,
    onRequestClearExpired: () => {
      setConfirming('expired');
    },
    onRequestClearAll: () => {
      setConfirming('all');
    },
  });

  const run = async (action: () => Promise<ActionOutcome>) => {
    setConfirming(null);
    const outcome = await action();
    setError(outcome.ok ? null : outcome.message);
  };

  return (
    <div className="flex flex-col gap-1 border-b border-line px-3 py-2 wide:px-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {commands.map((command) => (
          <Command
            key={command.key}
            tone={command.tone}
            label={command.label}
            onClick={command.onSelect}
          />
        ))}
        <Command
          className="ml-auto"
          label={LOCALE_LABEL[currentLocale]}
          aria-label={t(SWITCH_TO_KEY[currentLocale])}
          onClick={() => {
            setLocale(nextLocale);
          }}
        />
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
