import { useEffect, useRef, useState } from 'react';

import { useServices } from '../app/services-context';
import { useI18n } from '../i18n/i18n-context';
import { Command } from './command';

interface CopyCommandProps {
  /** What is copied, used in the accessible name ("copy email"). */
  readonly name: string;
  /** The exact, unmasked text to put on the clipboard. */
  readonly text: string;
}

const CONFIRM_MS = 1200;

/** Copies on a user gesture and confirms in place and to assistive technology (FR-016). */
export function CopyCommand({ name, text }: CopyCommandProps) {
  const { t } = useI18n();
  const { clipboard } = useServices();
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => {
    if (timer.current !== null) clearTimeout(timer.current);
  };

  useEffect(
    () => () => {
      if (timer.current !== null) clearTimeout(timer.current);
    },
    [],
  );

  const copy = async () => {
    const result = await clipboard.writeText(text);
    clearTimer();
    if (!result.ok) {
      setState('failed');
      return;
    }
    setState('copied');
    timer.current = setTimeout(() => {
      setState('idle');
    }, CONFIRM_MS);
  };

  return (
    <span className="inline-flex flex-col items-end">
      <Command
        label={state === 'copied' ? t('copy.copied') : t('copy.label')}
        aria-label={t('copy.field', [name])}
        onClick={() => {
          void copy();
        }}
      />
      <output className="sr-only">{state === 'copied' ? t('copy.announce', [name]) : ''}</output>
      {state === 'failed' && (
        <span role="alert" className="text-cite text-status-expired">
          {t('copy.failed')}
        </span>
      )}
    </span>
  );
}
