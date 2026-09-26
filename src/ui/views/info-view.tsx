import { Command } from '../components/command';
import { FocusHeading } from '../components/focus-heading';
import { Section } from '../components/section';
import { useI18n } from '../i18n/i18n-context';

interface InfoViewProps {
  readonly version: string;
  readonly onBack: () => void;
}

/** What the extension does, what it stores, and its version (FR-028, US5 AS3). */
export function InfoView({ version, onBack }: InfoViewProps) {
  const { t } = useI18n();

  return (
    <article className="flex flex-col gap-4 px-3 py-4 wide:px-4">
      <div className="flex items-center justify-between gap-4">
        <Command label={t('info.back')} onClick={onBack} />
        <span className="text-cite text-ink-muted">{t('info.version', [version])}</span>
      </div>
      <FocusHeading className="text-head">{t('info.title')}</FocusHeading>
      <p className="text-body text-ink">{t('info.purpose')}</p>
      <Section number={1} title={t('info.storedTitle')}>
        <p className="text-body text-ink">{t('info.stored')}</p>
      </Section>
      <Section number={2} title={t('info.notStoredTitle')}>
        <p className="text-body text-ink">{t('info.notStored')}</p>
      </Section>
      <Section number={3} title={t('info.roadmapTitle')}>
        <p className="text-body text-ink">{t('info.roadmapBuilt')}</p>
        <p className="text-body text-ink">{t('info.roadmapPlanned')}</p>
      </Section>
    </article>
  );
}
