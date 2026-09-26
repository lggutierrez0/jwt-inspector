import { useState } from 'react';

import { addToken } from '@/application/vault/add-token';

import { useServices } from '../app/services-context';
import type { DetailNotice } from '../app/view-reducer';
import { useI18n } from '../i18n/i18n-context';
import { decodeErrorMessage } from '../i18n/messages';

/** Submission state for the add form: runs the use case and maps results to UI outcomes. */
export function useAddToken(onSaved: (id: string, notice?: DetailNotice) => void) {
  const { t } = useI18n();
  const services = useServices();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (text: string) => {
    setBusy(true);
    const result = await addToken(text, { kind: 'manual' }, services);
    setBusy(false);
    if (result.kind === 'added' || result.kind === 'unsupportedJwe') onSaved(result.record.id);
    else if (result.kind === 'duplicate') onSaved(result.id, 'alreadySaved');
    else if (result.kind === 'invalid') setError(decodeErrorMessage(result.error, t));
    else setError(t('add.errors.saveFailed'));
  };

  const clearError = () => {
    setError(null);
  };

  return { error, busy, submit, clearError };
}
