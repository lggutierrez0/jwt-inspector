import { useMemo } from 'react';

import { decodeToken } from '@/domain/jwt/decode';
import type { TokenRecord } from '@/domain/vault/token-record';

import type { DetailNotice } from '../app/view-reducer';
import { Command } from '../components/command';
import { Section } from '../components/section';
import { useI18n } from '../i18n/i18n-context';
import { HeaderEntries, JwsDetail } from './jws-detail';

interface DetailViewProps {
  readonly record: TokenRecord;
  readonly notice?: DetailNotice;
  readonly onBack: () => void;
}

/** Everything public about one token, status first (FR-013), sensitive values masked (FR-015). */
export function DetailView({ record, notice, onBack }: DetailViewProps) {
  const { t } = useI18n();
  const decoded = useMemo(() => decodeToken(record.raw), [record.raw]);

  return (
    <article className="flex flex-col gap-4 px-3 py-4 wide:px-4">
      <div>
        <Command label={t('detail.back')} onClick={onBack} />
      </div>
      {notice === 'alreadySaved' && (
        <output className="block text-status-future">{t('detail.alreadySaved')}</output>
      )}
      <p className="break-words">
        <span className="text-label">{t('detail.tokenLabel')}</span> {record.label}
      </p>
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
