import { useState, type SubmitEvent } from 'react';

import type { DetailNotice } from '../app/view-reducer';
import { Command } from '../components/command';
import { TextField } from '../components/text-field';
import { useI18n } from '../i18n/i18n-context';
import { useAddToken } from './use-add-token';

interface AddTokenViewProps {
  readonly onSaved: (id: string, notice?: DetailNotice) => void;
  readonly onCancel: () => void;
}

/** Paste a token and save it (FR-001–FR-005). */
export function AddTokenView({ onSaved, onCancel }: AddTokenViewProps) {
  const { t } = useI18n();
  const [text, setText] = useState('');
  const { error, busy, submit, clearError } = useAddToken(onSaved);

  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit(text);
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2 px-3 py-4 wide:px-4">
      <h2 className="text-head">{t('add.title')}</h2>
      <TextField
        label={t('add.label')}
        helper={t('add.helper')}
        error={error}
        value={text}
        onChange={(value) => {
          setText(value);
          clearError();
        }}
        onEnter={() => {
          void submit(text);
        }}
      />
      <div className="flex flex-wrap items-center gap-4 pt-2">
        <Command type="submit" tone="primary" label={t('add.submit')} disabled={busy} />
        <Command label={t('add.cancel')} onClick={onCancel} />
      </div>
    </form>
  );
}
