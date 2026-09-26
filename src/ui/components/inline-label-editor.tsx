import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

import type { ActionOutcome } from '../app/action-outcome';
import { useI18n } from '../i18n/i18n-context';
import { Command } from './command';
import { FocusHeading } from './focus-heading';

interface LabelFormProps {
  readonly initial: string;
  readonly onSave: (label: string) => Promise<ActionOutcome>;
  readonly onClose: () => void;
}

/** Edit mode: the label is selected on open; Enter saves, Escape cancels. */
function LabelForm({ initial, onSave, onClose }: LabelFormProps) {
  const { t } = useI18n();
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const field = useRef<HTMLInputElement>(null);
  const fieldId = useId();
  const errorId = useId();

  useEffect(() => {
    field.current?.focus();
    field.current?.select();
  }, []);

  const save = async () => {
    const outcome = await onSave(draft);
    if (outcome.ok) onClose();
    else setError(outcome.message);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void save();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="text-label">
        {t('label.field')}
      </label>
      <input
        ref={field}
        id={fieldId}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        onKeyDown={onKeyDown}
        aria-invalid={error !== null}
        aria-describedby={error === null ? undefined : errorId}
        className="w-full rounded-control border border-line-strong bg-surface-sunken px-2 py-1 caret-focus aria-invalid:border-status-expired"
      />
      {error !== null && (
        <p id={errorId} role="alert" className="text-status-expired">
          {error}
        </p>
      )}
      <div className="flex gap-4">
        <Command
          tone="primary"
          label={t('label.save')}
          onClick={() => {
            void save();
          }}
        />
        <Command label={t('label.cancel')} onClick={onClose} />
      </div>
    </div>
  );
}

interface InlineLabelEditorProps {
  readonly label: string;
  readonly onRename: (label: string) => Promise<ActionOutcome>;
}

/** The token label with an in-place rename (US4 AS1, FR-017). */
export function InlineLabelEditor({ label, onRename }: InlineLabelEditorProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <LabelForm
        initial={label}
        onSave={onRename}
        onClose={() => {
          setEditing(false);
        }}
      />
    );
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 break-words">
      <span className="text-label" aria-hidden="true">
        {t('detail.tokenLabel')}
      </span>
      <FocusHeading className="text-head">{label}</FocusHeading>
      <Command
        label={t('label.rename')}
        onClick={() => {
          setEditing(true);
        }}
      />
    </div>
  );
}
