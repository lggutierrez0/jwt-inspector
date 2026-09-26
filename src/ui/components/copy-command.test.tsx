import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { RecordingClipboard } from '../../../tests/support/in-memory-ports';
import { renderWithProviders } from '../../../tests/support/render';
import { CopyCommand } from './copy-command';

describe('CopyCommand (FR-016)', () => {
  it('copies the exact text and confirms for 1.2 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    const clipboard = new RecordingClipboard();
    renderWithProviders(<CopyCommand name="email" text="maria@example.test" />, { clipboard });

    await user.click(screen.getByRole('button', { name: 'copy email' }));

    expect(clipboard.written).toEqual(['maria@example.test']);
    expect(screen.getByRole('button', { name: 'copy email' })).toHaveTextContent('copied');
    expect(screen.getByRole('status')).toHaveTextContent('email copied');

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(screen.getByRole('button', { name: 'copy email' })).toHaveTextContent('copy');
    expect(screen.getByRole('button', { name: 'copy email' })).not.toHaveTextContent('copied');
    vi.useRealTimers();
  });

  it('explains a clipboard failure', async () => {
    const user = userEvent.setup();
    const clipboard = new RecordingClipboard();
    clipboard.fail = true;
    renderWithProviders(<CopyCommand name="token" text="a.b.c" />, { clipboard });

    await user.click(screen.getByRole('button', { name: 'copy token' }));

    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't copy to the clipboard.");
  });
});
