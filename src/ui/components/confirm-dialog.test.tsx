import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../tests/support/render';
import { ConfirmDialog } from './confirm-dialog';

function setup() {
  const onConfirm = vi.fn<() => void>();
  const onCancel = vi.fn<() => void>();
  const user = userEvent.setup();
  renderWithProviders(
    <>
      <button type="button">trigger</button>
      <ConfirmDialog title="Remove 3 tokens?" onConfirm={onConfirm} onCancel={onCancel} />
    </>,
  );
  return { onConfirm, onCancel, user };
}

describe('ConfirmDialog (FR-019, FR-023)', () => {
  it('asks with the exact count and warns it cannot be undone', () => {
    setup();

    const dialog = screen.getByRole('dialog', { name: 'Remove 3 tokens?' });
    expect(dialog).toHaveTextContent("This can't be undone.");
    expect(dialog).toHaveAttribute('open');
  });

  it('starts on the safe choice', () => {
    setup();

    expect(screen.getByRole('button', { name: 'cancel' })).toHaveFocus();
  });

  it('confirms', async () => {
    const { user, onConfirm, onCancel } = setup();

    await user.click(screen.getByRole('button', { name: 'remove' }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('cancels with the button or Escape', async () => {
    const { user, onCancel } = setup();

    await user.click(screen.getByRole('button', { name: 'cancel' }));
    screen.getByRole('dialog').dispatchEvent(new Event('cancel', { cancelable: true }));

    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it('returns focus to what was focused before it opened', () => {
    const onCancel = vi.fn<() => void>();
    const { rerender } = renderWithProviders(<button type="button">trigger</button>);
    screen.getByRole('button', { name: 'trigger' }).focus();
    rerender(
      <>
        <button type="button">trigger</button>
        <ConfirmDialog title="Remove?" onConfirm={vi.fn<() => void>()} onCancel={onCancel} />
      </>,
    );

    rerender(<button type="button">trigger</button>);

    expect(screen.getByRole('button', { name: 'trigger' })).toHaveFocus();
  });
});
