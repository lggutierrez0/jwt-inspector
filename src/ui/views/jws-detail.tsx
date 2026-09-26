import { describeClaim, describeHeaderParameter } from '@/domain/claims/claim-catalog';
import type { DecodedJws, JsonObject } from '@/domain/jwt/types';
import { computeLifetime } from '@/domain/time/lifetime';
import { evaluateStatus, type TimeWarning } from '@/domain/time/status';
import { readTimeClaims } from '@/domain/time/time-claims';

import { useNow } from '../clock/use-now';
import { ClaimEntry } from '../components/claim-entry';
import { FrontMatter } from '../components/front-matter';
import { JsonView } from '../components/json-view';
import { Section } from '../components/section';
import { statusText } from '../components/status-text';
import { StructureFigure } from '../components/structure-figure';
import { TimeRuler } from '../components/time-ruler';
import { TimingList } from '../components/timing-list';
import { useI18n } from '../i18n/i18n-context';

function TimeWarnings({ warnings }: { readonly warnings: readonly TimeWarning[] }) {
  const { t } = useI18n();
  return warnings.map((warning) =>
    warning.kind === 'invalidClaim' ? (
      <p key={warning.claim} className="text-status-soon">
        {t('detail.warnings.invalidClaim', [warning.claim])}
      </p>
    ) : (
      <p key={warning.kind} className="text-status-soon">
        {t('detail.warnings.expBeforeIat')}
      </p>
    ),
  );
}

export function HeaderEntries({ header }: { readonly header: JsonObject }) {
  return Object.entries(header).map(([name, value]) => (
    <ClaimEntry
      key={name}
      name={name}
      value={value}
      part="header"
      info={describeHeaderParameter(name)}
    />
  ));
}

export function JwsDetail({ token }: { readonly token: DecodedJws }) {
  const { t, locale } = useI18n();
  const now = useNow();
  const claims = readTimeClaims(token.payload);
  const evaluation = evaluateStatus(claims, now);
  const status = statusText(evaluation, claims, now, t, locale);
  const lifetime = computeLifetime(claims);

  return (
    <>
      <FrontMatter payload={token.payload} status={status} />
      <TimingList claims={claims} now={now} />
      <TimeWarnings warnings={evaluation.warnings} />
      {lifetime.kind === 'known' && (
        <TimeRuler
          lifetime={lifetime}
          now={now}
          tone={status.tone === 'neutral' ? 'valid' : status.tone}
        />
      )}
      <Section number={1} title={t('detail.sections.structure')}>
        <StructureFigure segments={token.segments} />
      </Section>
      <Section number={2} title={t('detail.sections.header')}>
        <HeaderEntries header={token.header} />
      </Section>
      <Section number={3} title={t('detail.sections.payload')}>
        {Object.entries(token.payload).map(([name, value]) => (
          <ClaimEntry
            key={name}
            name={name}
            value={value}
            part="payload"
            info={describeClaim(name)}
          />
        ))}
      </Section>
      <Section number={4} title={t('detail.sections.json')}>
        <JsonView name={t('detail.jsonOf', [t('parts.header')])} value={token.header} />
        <JsonView name={t('detail.jsonOf', [t('parts.payload')])} value={token.payload} />
      </Section>
    </>
  );
}
