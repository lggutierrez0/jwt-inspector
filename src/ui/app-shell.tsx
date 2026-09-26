import { useCallback, useReducer } from 'react';

import type { TokenRecord } from '@/domain/vault/token-record';
import { findById } from '@/domain/vault/token-record';

import type { ActionOutcome } from './app/action-outcome';
import { useRemovedTokenGuard } from './app/use-removed-token-guard';
import { useUndoableDelete } from './app/use-undoable-delete';
import type { VaultView } from './app/use-vault';
import { useVault } from './app/use-vault';
import { useVaultActions } from './app/use-vault-actions';
import { INITIAL_VIEW, viewReducer, type Screen, type ViewAction } from './app/view-reducer';
import { CommandBar } from './components/command-bar';
import { UndoToast } from './components/undo-toast';
import { useI18n } from './i18n/i18n-context';
import { AddTokenView } from './views/add-token-view';
import { DetailView } from './views/detail-view';
import { InfoView } from './views/info-view';
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

function AppHeader({ version }: { readonly version: string }) {
  const { t } = useI18n();
  return (
    <header className="flex items-baseline gap-2 border-b border-line px-3 py-3 wide:px-4">
      <h1 className="text-head">{t('extName')}</h1>
      <span className="text-cite text-ink-muted">v{version}</span>
    </header>
  );
}

interface AppMainProps {
  readonly version: string;
  readonly vault: VaultView;
  readonly view: { readonly screen: Screen; readonly listScroll: number };
  readonly openRecord: TokenRecord | undefined;
  readonly dispatch: (action: ViewAction) => void;
  readonly actions: {
    readonly rename: (id: string, label: string) => Promise<ActionOutcome>;
    readonly remove: (id: string) => Promise<ActionOutcome>;
  };
  readonly focusId: string | null;
}

/** The one view for the current screen; extracted so `AppShell` stays a thin coordinator. */
function AppMain({ version, vault, view, openRecord, dispatch, actions, focusId }: AppMainProps) {
  const { t } = useI18n();
  const { screen } = view;
  const openDetail = useCallback(
    (id: string, listScroll: number) => {
      dispatch({ type: 'openDetail', id, listScroll });
    },
    [dispatch],
  );
  const back = useCallback(() => {
    dispatch({ type: 'back' });
  }, [dispatch]);

  if (vault.status === 'loading') return <LoadingSkeleton label={t('app.loading')} />;
  if (vault.status === 'error') {
    return (
      <p role="alert" className="px-3 py-4 text-status-expired wide:px-4">
        {t('app.loadError')}
      </p>
    );
  }
  if (screen.name === 'list') {
    return (
      <ListView
        tokens={vault.state.tokens}
        initialScroll={view.listScroll}
        focusId={focusId}
        onOpen={openDetail}
      />
    );
  }
  if (screen.name === 'add') {
    return (
      <AddTokenView
        onSaved={(id, notice) => {
          dispatch(
            notice === undefined ? { type: 'openDetail', id } : { type: 'openDetail', id, notice },
          );
        }}
        onCancel={back}
      />
    );
  }
  if (screen.name === 'info') return <InfoView version={version} onBack={back} />;
  if (openRecord === undefined) return null;
  return (
    <DetailView
      key={openRecord.id}
      record={openRecord}
      {...(screen.notice === undefined ? {} : { notice: screen.notice })}
      onBack={back}
      onRename={(label) => actions.rename(openRecord.id, label)}
      onDelete={() => actions.remove(openRecord.id)}
    />
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
  const openInfo = useCallback(() => {
    dispatch({ type: 'openInfo' });
  }, []);
  const { deleted, onDeleted, dismiss: dismissUndo } = useUndoableDelete(dispatch);
  const actions = useVaultActions(onDeleted);

  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <AppHeader version={version} />
      {vault.status === 'ready' && (
        <CommandBar
          screen={screen.name}
          tokens={vault.state.tokens}
          onAdd={openAdd}
          onInfo={openInfo}
          onClearAll={actions.clearAll}
          onClearExpired={actions.clearExpired}
        />
      )}
      <main className={`flex-1 ${deleted === null ? '' : 'pb-16'}`} data-screen={screen.name}>
        <AppMain
          version={version}
          vault={vault}
          view={view}
          openRecord={openRecord}
          dispatch={dispatch}
          actions={actions}
          focusId={view.lastOpenedId}
        />
      </main>
      {/* Always mounted so screen readers reliably announce changes (a live region born full is not). */}
      <output className="sr-only">{deleted === null ? '' : t('remove.deleted')}</output>
      {deleted !== null && (
        <UndoToast
          key={deleted.record.id}
          onUndo={() => {
            void actions.restore(deleted);
          }}
          onDismiss={dismissUndo}
        />
      )}
    </div>
  );
}
