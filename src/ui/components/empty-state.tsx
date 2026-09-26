import { useI18n } from '../i18n/i18n-context';
import { Command } from './command';

/** First run: what the tool does, where tokens live, and the one action to take (FR-012). */
export function EmptyState({ onAdd }: { readonly onAdd: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-start gap-3 px-3 py-8 wide:px-4">
      <h2 className="text-head">{t('empty.title')}</h2>
      <p className="max-w-prose text-ink-muted">{t('empty.body')}</p>
      <Command tone="primary" label={t('add.open')} onClick={onAdd} />
    </div>
  );
}
