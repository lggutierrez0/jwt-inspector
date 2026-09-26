import { LABEL_MAX_LENGTH } from './token-record';

export type LabelValidation =
  | { readonly ok: true; readonly label: string }
  | { readonly ok: false; readonly reason: 'empty' | 'tooLong' };

/** Labels are 1–60 characters after trimming (FR-017). */
export function validateLabel(input: string): LabelValidation {
  const label = input.trim();
  if (label.length === 0) return { ok: false, reason: 'empty' };
  if (label.length > LABEL_MAX_LENGTH) return { ok: false, reason: 'tooLong' };
  return { ok: true, label };
}
