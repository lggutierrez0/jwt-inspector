import { useReducer } from 'react';

import { useVault } from './app/use-vault';
import { INITIAL_VIEW, viewReducer } from './app/view-reducer';
import { useI18n } from './i18n/i18n-context';

interface AppShellProps {
  readonly version: string;
}

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <output aria-busy="true" aria-label={label} className="flex flex-col gap-4 px-3 py-4">
      {[0, 1, 2].map((line) => (
        <div key={line} className="flex flex-col gap-2 border-b border-line pb-4">
          <div className="h-3 w-3/5 bg-surface-sunken" />
          <div className="h-2 w-2/5 bg-surface-sunken" />
        </div>
      ))}
    </output>
  );
}

export function AppShell({ version }: AppShellProps) {
  const { t } = useI18n();
  const vault = useVault();
  const [view] = useReducer(viewReducer, INITIAL_VIEW);

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="flex items-baseline justify-between border-b border-line px-3 py-3 min-[400px]:px-4">
        <h1 className="text-head">{t('extName')}</h1>
        <span className="text-cite text-ink-muted">v{version}</span>
      </header>
      <main className="flex-1" data-screen={view.screen.name}>
        {vault.status === 'loading' && <LoadingSkeleton label={t('app.loading')} />}
        {vault.status === 'error' && (
          <p role="alert" className="px-3 py-4 text-status-expired min-[400px]:px-4">
            {t('app.loadError')}
          </p>
        )}
      </main>
    </div>
  );
}
