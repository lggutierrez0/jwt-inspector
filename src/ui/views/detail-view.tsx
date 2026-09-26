import { useMemo, useState } from 'react';

import { decodeToken } from '@/domain/jwt/decode';
import type { TokenRecord } from '@/domain/vault/token-record';

import type { ActionOutcome } from '../app/action-outcome';
import type { DetailNotice } from '../app/view-reducer';
import { Command } from '../components/command';
import { InlineLabelEditor } from '../components/inline-label-editor';
import { Section } from '../components/section';
import { useI18n } from '../i18n/i18n-context';
import { HeaderEntries, JwsDetail } from './jws-detail';

interface DetailViewProps {
  readonly record: TokenRecord;
  readonly notice?: DetailNotice;
  readonly onBack: () => void;
  readonly onRename: (label: string) => Promise<ActionOutcome>;
  readonly onDelete: () => Promise<ActionOutcome>;
}

/** Everything public about one token, status first (FR-013), sensitive values masked (FR-015). */
export function DetailView({ record, notice, onBack, onRename, onDelete }: DetailViewProps) {
  const { t } = useI18n();
  const [error, setError] = useState<string | null>(null);
  const decoded = useMemo(() => decodeToken(record.raw), [record.raw]);

  return (
    <article className="flex flex-col gap-4 px-3 py-4 wide:px-4">
      <div className="flex items-center justify-between gap-4">
        <Command label={t('detail.back')} onClick={onBack} />
        <Command
          tone="danger"
          label={t('remove.delete')}
          onClick={() => {
            void onDelete().then((outcome) => {
              setError(outcome.ok ? null : outcome.message);
              return outcome;
            });
          }}
        />
      </div>
      {error !== null && (
        <p role="alert" className="text-status-expired">
          {error}
        </p>
      )}
      {notice === 'alreadySaved' && (
        <output className="block text-status-future">{t('detail.alreadySaved')}</output>
      )}
      <InlineLabelEditor label={record.label} onRename={onRename} />
      {!decoded.ok && (
        <p role="alert" className="text-status-expired">
          {t('detail.undecodable')}
        </p>
      )}
      {decoded.ok && decoded.token.kind === 'jws' && <JwsDetail token={decoded.token} />}
      {decoded.ok && decoded.token.kind === 'jwe' && (
        <>
          <p className="text-status-future">{t('detail.jwe')}</p>
          <Section number={1} title={t('detail.sections.header')}>
            <HeaderEntries header={decoded.token.header} />
          </Section>
        </>
      )}
    </article>
  );
}
