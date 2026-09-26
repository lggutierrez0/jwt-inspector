import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../tests/support/render';
import { UndoToast } from './undo-toast';

describe('UndoToast (US4 AS2, FR-018)', () => {
  it('offers undo for 5 seconds, then dismisses itself', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn<() => void>();
    renderWithProviders(<UndoToast onUndo={vi.fn<() => void>()} onDismiss={onDismiss} />);

    expect(screen.getByText('Token deleted.')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4999);
    });
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('calls undo once', async () => {
    const user = userEvent.setup();
    const onUndo = vi.fn<() => void>();
    renderWithProviders(<UndoToast onUndo={onUndo} onDismiss={vi.fn<() => void>()} />);

    await user.click(screen.getByRole('button', { name: 'undo' }));

    expect(onUndo).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'undo' })).not.toBeInTheDocument();
  });

  it('pauses the countdown while pointed at or focused (WCAG 2.2.1)', () => {
    vi.useFakeTimers();
    const onDismiss = vi.fn<() => void>();
    renderWithProviders(<UndoToast onUndo={vi.fn<() => void>()} onDismiss={onDismiss} />);

    act(() => {
      screen.getByRole('button', { name: 'undo' }).focus();
    });
    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      screen.getByRole('button', { name: 'undo' }).blur();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onDismiss).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });
});
