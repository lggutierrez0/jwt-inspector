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
  const [paused, setPaused] = useState(false);

  // The undo window restarts after the pointer or focus leaves (WCAG 2.2.1).
  useEffect(() => {
    const timer = paused ? null : setTimeout(onDismiss, UNDO_WINDOW_MS);
    return () => {
      if (timer !== null) clearTimeout(timer);
    };
  }, [onDismiss, paused]);

  return (
    <div
      onPointerEnter={() => {
        setPaused(true);
      }}
      onPointerLeave={() => {
        setPaused(false);
      }}
      onFocus={() => {
        setPaused(true);
      }}
      onBlur={() => {
        setPaused(false);
      }}
      className="fixed inset-x-3 bottom-3 z-10 flex items-center justify-between gap-3 rounded-control bg-surface-raised px-3 py-2 shadow-float wide:inset-x-4"
    >
      {/* Announced by the shell's persistent live region; this is the visible copy. */}
      <span>{t('remove.deleted')}</span>
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
