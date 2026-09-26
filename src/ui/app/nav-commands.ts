import type { Screen } from './view-reducer';

export interface NavCommand {
  readonly key: string;
  readonly label: string;
  readonly tone: 'default' | 'primary';
  readonly onSelect: () => void;
}

interface BuildNavCommandsInput {
  readonly screen: Screen['name'];
  readonly tokenCount: number;
  readonly expiredCount: number;
  readonly t: (key: string) => string;
  readonly onAdd: () => void;
  readonly onInfo: () => void;
  readonly onRequestClearExpired: () => void;
  readonly onRequestClearAll: () => void;
}

/**
 * The persistent command bar (FR-027), present on every screen. A composed list, not a
 * hardcoded row: a later feature (builder, detection) adds its own entry here without touching
 * the bar itself or any other command's condition.
 */
export function buildNavCommands({
  screen,
  tokenCount,
  expiredCount,
  t,
  onAdd,
  onInfo,
  onRequestClearExpired,
  onRequestClearAll,
}: BuildNavCommandsInput): readonly NavCommand[] {
  const commands: NavCommand[] = [];
  if (screen !== 'add') {
    commands.push({ key: 'add', label: t('add.open'), tone: 'primary', onSelect: onAdd });
  }
  if (expiredCount > 0) {
    commands.push({
      key: 'clearExpired',
      label: t('remove.clearExpired'),
      tone: 'default',
      onSelect: onRequestClearExpired,
    });
  }
  if (tokenCount > 0) {
    commands.push({
      key: 'clearAll',
      label: t('remove.clearAll'),
      tone: 'default',
      onSelect: onRequestClearAll,
    });
  }
  if (screen !== 'info') {
    commands.push({ key: 'info', label: t('info.open'), tone: 'default', onSelect: onInfo });
  }
  return commands;
}
