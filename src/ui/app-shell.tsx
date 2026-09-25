interface AppShellProps {
  readonly version: string;
}

export function AppShell({ version }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h1 className="text-sm font-semibold tracking-tight">JWT Inspector</h1>
        <span className="font-mono text-xs text-ink-muted">v{version}</span>
      </header>
    </div>
  );
}
