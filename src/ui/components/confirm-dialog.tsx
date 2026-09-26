import { useEffect, useId, useRef } from 'react';

import { useI18n } from '../i18n/i18n-context';
import { Command } from './command';

interface ConfirmDialogProps {
  /** The question, stating the exact count ("Remove 3 tokens?"). */
  readonly title: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/**
 * Native modal dialog for irreversible removals (FR-019, FR-023): the browser traps focus; it
 * opens on the safe choice and returns focus to where it was when it closes.
 */
export function ConfirmDialog({ title, onConfirm, onCancel }: ConfirmDialogProps) {
  const { t } = useI18n();
  const dialog = useRef<HTMLDialogElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const element = dialog.current;
    if (element !== null && !element.open) element.showModal();
    cancel.current?.focus();
    return () => {
      previous?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-full max-w-sm rounded-control bg-surface-raised p-4 text-ink shadow-float backdrop:bg-scrim"
    >
      <h2 id={titleId} className="text-head">
        {title}
      </h2>
      <p className="pt-2 text-ink-muted">{t('remove.irreversible')}</p>
      <div className="flex justify-end gap-4 pt-4">
        <Command ref={cancel} label={t('remove.cancel')} onClick={onCancel} />
        <Command tone="danger" label={t('remove.confirm')} onClick={onConfirm} />
      </div>
    </dialog>
  );
}
