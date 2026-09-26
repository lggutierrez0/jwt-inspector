import { useId, type KeyboardEvent } from 'react';

interface TextFieldProps {
  readonly label: string;
  readonly helper?: string;
  readonly error: string | null;
  readonly value: string;
  readonly onChange: (value: string) => void;
  /** Enter submits; Shift+Enter still inserts a new line. */
  readonly onEnter?: () => void;
  readonly rows?: number;
}

/**
 * Multi-line field with the label above, helper text, and the error below the field, all wired
 * for assistive technology (DESIGN.md "Other", taste form rules).
 */
export function TextField({
  label,
  helper,
  error,
  value,
  onChange,
  onEnter,
  rows = 6,
}: TextFieldProps) {
  const fieldId = useId();
  const helperId = useId();
  const errorId = useId();
  const describedBy = [helper === undefined ? null : helperId, error === null ? null : errorId]
    .filter((id) => id !== null)
    .join(' ');

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (onEnter !== undefined && event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={fieldId} className="text-label">
        {label}
      </label>
      {helper !== undefined && (
        <p id={helperId} className="text-cite text-ink-muted">
          {helper}
        </p>
      )}
      <textarea
        id={fieldId}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        onKeyDown={onKeyDown}
        rows={rows}
        spellCheck={false}
        autoComplete="off"
        aria-describedby={describedBy === '' ? undefined : describedBy}
        aria-invalid={error !== null}
        className="w-full resize-y rounded-control border border-line-strong bg-surface-sunken p-2 break-all font-stretch-condensed caret-focus placeholder:text-ink-muted aria-invalid:border-status-expired"
      />
      {error !== null && (
        <p id={errorId} role="alert" className="text-status-expired">
          {error}
        </p>
      )}
    </div>
  );
}
