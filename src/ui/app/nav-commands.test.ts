import { buildNavCommands } from './nav-commands';

const t = (key: string) => key;

const base = {
  t,
  tokenCount: 0,
  expiredCount: 0,
  onAdd: vi.fn<() => void>(),
  onInfo: vi.fn<() => void>(),
  onRequestClearExpired: vi.fn<() => void>(),
  onRequestClearAll: vi.fn<() => void>(),
};

describe('buildNavCommands (FR-027)', () => {
  it('orders add, clear expired, clear all, info on the list with an empty vault', () => {
    const commands = buildNavCommands({ ...base, screen: 'list' });

    expect(commands.map((command) => command.key)).toEqual(['add', 'info']);
  });

  it('includes "clear expired" only when at least one token is expired', () => {
    const commands = buildNavCommands({ ...base, screen: 'list', expiredCount: 1 });

    expect(commands.map((command) => command.key)).toEqual(['add', 'clearExpired', 'info']);
  });

  it('includes "clear all" only when the vault is non-empty', () => {
    const commands = buildNavCommands({ ...base, screen: 'list', tokenCount: 3, expiredCount: 1 });

    expect(commands.map((command) => command.key)).toEqual([
      'add',
      'clearExpired',
      'clearAll',
      'info',
    ]);
  });

  it('omits "add token" on the add screen (US5 AS2)', () => {
    const commands = buildNavCommands({ ...base, screen: 'add' });

    expect(commands.map((command) => command.key)).not.toContain('add');
  });

  it('omits "info" on the info screen (US5 AS2)', () => {
    const commands = buildNavCommands({ ...base, screen: 'info' });

    expect(commands.map((command) => command.key)).not.toContain('info');
  });

  it('calls the matching handler when a command is selected', () => {
    const onAdd = vi.fn<() => void>();
    const commands = buildNavCommands({ ...base, screen: 'list', onAdd });

    commands.find((command) => command.key === 'add')?.onSelect();

    expect(onAdd).toHaveBeenCalledOnce();
  });

  it('marks "add token" as the primary command', () => {
    const commands = buildNavCommands({ ...base, screen: 'list' });

    expect(commands.find((command) => command.key === 'add')?.tone).toBe('primary');
  });
});
