import { useI18n } from '../i18n/i18n-context';

/**
 * First run: what the tool does and where tokens live (FR-012). The one action to take,
 * `[ add token ]`, is always visible in the command bar above (FR-027), so it is not repeated
 * here.
 */
export function EmptyState() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-start gap-3 px-3 py-8 wide:px-4">
      <h2 className="text-head">{t('empty.title')}</h2>
      <p className="max-w-prose text-ink-muted">{t('empty.body')}</p>
    </div>
  );
}
