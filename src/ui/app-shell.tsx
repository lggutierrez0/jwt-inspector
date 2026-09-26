import { useCallback, useReducer } from 'react';

import { findById } from '@/domain/vault/token-record';

import { useRemovedTokenGuard } from './app/use-removed-token-guard';
import { useVault } from './app/use-vault';
import { INITIAL_VIEW, viewReducer } from './app/view-reducer';
import { Command } from './components/command';
import { useI18n } from './i18n/i18n-context';
import { AddTokenView } from './views/add-token-view';
import { DetailView } from './views/detail-view';
import { ListView } from './views/list-view';

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

interface AppHeaderProps {
  readonly version: string;
  /** Shown when adding is possible from the current screen. */
  readonly onAdd: (() => void) | null;
}

function AppHeader({ version, onAdd }: AppHeaderProps) {
  const { t } = useI18n();
  return (
    <header className="flex items-center justify-between gap-2 border-b border-line px-3 py-3 wide:px-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-head">{t('extName')}</h1>
        <span className="text-cite text-ink-muted">v{version}</span>
      </div>
      {onAdd !== null && <Command tone="primary" label={t('add.open')} onClick={onAdd} />}
    </header>
  );
}

export function AppShell({ version }: AppShellProps) {
  const { t } = useI18n();
  const vault = useVault();
  const [view, dispatch] = useReducer(viewReducer, INITIAL_VIEW);
  const { screen } = view;
  const openRecord =
    vault.status === 'ready' && screen.name === 'detail'
      ? findById(vault.state, screen.id)
      : undefined;

  useRemovedTokenGuard(vault, screen, openRecord, dispatch);

  const openAdd = useCallback(() => {
    dispatch({ type: 'openAdd' });
  }, []);
  const openDetail = useCallback((id: string, listScroll: number) => {
    dispatch({ type: 'openDetail', id, listScroll });
  }, []);
  // The empty state carries the only "add token" action (one action per intent).
  const hasTokens = vault.status === 'ready' && vault.state.tokens.length > 0;

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <AppHeader version={version} onAdd={hasTokens && screen.name !== 'add' ? openAdd : null} />
      <main className="flex-1" data-screen={screen.name}>
        {vault.status === 'loading' && <LoadingSkeleton label={t('app.loading')} />}
        {vault.status === 'error' && (
          <p role="alert" className="px-3 py-4 text-status-expired wide:px-4">
            {t('app.loadError')}
          </p>
        )}
        {vault.status === 'ready' && screen.name === 'list' && (
          <ListView
            tokens={vault.state.tokens}
            initialScroll={view.listScroll}
            onOpen={openDetail}
            onAdd={openAdd}
          />
        )}
        {vault.status === 'ready' && screen.name === 'add' && (
          <AddTokenView
            onSaved={(id, notice) => {
              dispatch(
                notice === undefined
                  ? { type: 'openDetail', id }
                  : { type: 'openDetail', id, notice },
              );
            }}
            onCancel={() => {
              dispatch({ type: 'back' });
            }}
          />
        )}
        {openRecord !== undefined && screen.name === 'detail' && (
          <DetailView
            key={openRecord.id}
            record={openRecord}
            {...(screen.notice === undefined ? {} : { notice: screen.notice })}
            onBack={() => {
              dispatch({ type: 'back' });
            }}
          />
        )}
      </main>
    </div>
  );
}
