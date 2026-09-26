import { useState, type ReactNode } from 'react';

import { useI18n } from '../i18n/i18n-context';
import { Command } from './command';

interface MaskedValueProps {
  /** Field name used in accessible labels and announcements ("email"). */
  readonly name: string;
  readonly revealed: ReactNode;
  /** What to show while masked; defaults to the localized "[masked]" marker. */
  readonly concealed?: ReactNode;
  /** Block content (e.g. a JSON <pre>): takes the full width so the content scrolls, not the page. */
  readonly block?: boolean;
}

/**
 * Masked by default, revealed per field on explicit request (constitution III, FR-015). State is
 * local, so closing and reopening the view masks everything again.
 */
export function MaskedValue({ name, revealed, concealed, block = false }: MaskedValueProps) {
  const { t } = useI18n();
  const [shown, setShown] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const toggle = () => {
    setShown((current) => !current);
    setAnnouncement(shown ? t('mask.hidden', [name]) : t('mask.revealed', [name]));
  };

  return (
    <span
      className={
        block
          ? 'flex w-full min-w-0 flex-col gap-1'
          : 'inline-flex flex-wrap items-baseline gap-x-2'
      }
    >
      <span className={`min-w-0 break-all font-stretch-condensed ${block ? 'order-2' : ''}`}>
        {shown
          ? revealed
          : (concealed ?? <span className="text-ink-muted">[{t('mask.masked')}]</span>)}
      </span>
      <Command
        label={shown ? t('mask.hide') : t('mask.reveal')}
        aria-label={shown ? t('mask.hideField', [name]) : t('mask.revealField', [name])}
        aria-pressed={shown}
        onClick={toggle}
      />
      <output className="sr-only">{announcement}</output>
    </span>
  );
}
