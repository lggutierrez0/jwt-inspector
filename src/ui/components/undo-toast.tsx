import { useEffect, useState } from 'react';

import { useI18n } from '../i18n/i18n-context';
import { Command } from './command';

interface UndoToastProps {
  readonly onUndo: () => void;
  readonly onDismiss: () => void;
}

const UNDO_WINDOW_MS = 5000;

/** Floating confirmation after a delete with a 5 second undo window (FR-018). */
export function UndoToast({ onUndo, onDismiss }: UndoToastProps) {
  const { t } = useI18n();
  const [undone, setUndone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(onDismiss, UNDO_WINDOW_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [onDismiss]);

  return (
    <div className="fixed inset-x-3 bottom-3 z-10 flex items-center justify-between gap-3 rounded-control bg-surface-raised px-3 py-2 shadow-float wide:inset-x-4">
      <output>{t('remove.deleted')}</output>
      {!undone && (
        <Command
          label={t('remove.undo')}
          onClick={() => {
            setUndone(true);
            onUndo();
          }}
        />
      )}
    </div>
  );
}
