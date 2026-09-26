import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../tests/support/render';
import type { ActionOutcome } from '../app/action-outcome';
import { InlineLabelEditor } from './inline-label-editor';

function setup(outcome?: ActionOutcome) {
  const onRename = vi
    .fn<(label: string) => Promise<ActionOutcome>>()
    .mockResolvedValue(outcome ?? { ok: true });
  const user = userEvent.setup();
  renderWithProviders(<InlineLabelEditor label="Checkout" onRename={onRename} />);
  return { onRename, user };
}

describe('InlineLabelEditor (US4 AS1, FR-017)', () => {
  it('shows the label with a rename command', () => {
    setup();

    expect(screen.getByText('Checkout')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'rename' })).toBeInTheDocument();
  });

  it('enters edit mode with the current label selected', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: 'rename' }));

    const field = screen.getByRole('textbox', { name: 'Label' });
    expect(field).toHaveFocus();
    expect(field).toHaveValue('Checkout');
    expect(field).toHaveProperty('selectionStart', 0);
    expect(field).toHaveProperty('selectionEnd', 'Checkout'.length);
  });

  it('saves with Enter', async () => {
    const { user, onRename } = setup();
    await user.click(screen.getByRole('button', { name: 'rename' }));

    await user.clear(screen.getByRole('textbox', { name: 'Label' }));
    await user.type(screen.getByRole('textbox', { name: 'Label' }), 'Staging{Enter}');

    expect(onRename).toHaveBeenCalledWith('Staging');
    expect(screen.queryByRole('textbox', { name: 'Label' })).not.toBeInTheDocument();
  });

  it('cancels with Escape without saving', async () => {
    const { user, onRename } = setup();
    await user.click(screen.getByRole('button', { name: 'rename' }));

    await user.keyboard('{Escape}');

    expect(onRename).not.toHaveBeenCalled();
    expect(screen.getByText('Checkout')).toBeInTheDocument();
  });

  it('keeps editing and explains why an invalid label was refused', async () => {
    const { user } = setup({ ok: false, message: "The label can't be empty." });
    await user.click(screen.getByRole('button', { name: 'rename' }));

    await user.clear(screen.getByRole('textbox', { name: 'Label' }));
    await user.keyboard('{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent("The label can't be empty.");
    expect(screen.getByRole('textbox', { name: 'Label' })).toHaveAttribute('aria-invalid', 'true');
  });
});
