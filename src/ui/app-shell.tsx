interface AppShellProps {
  readonly version: string;
}

export function AppShell({ version }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface text-ink">
      <header className="flex items-baseline justify-between border-b border-line px-3 py-3 min-[400px]:px-4">
        <h1 className="text-head">JWT Inspector</h1>
        <span className="text-cite text-ink-muted">v{version}</span>
      </header>
    </div>
  );
}
