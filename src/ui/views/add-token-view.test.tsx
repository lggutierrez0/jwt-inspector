import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { jwe5Parts, malformedCorpus, over64KiB, valid1h } from '../../../tests/fixtures/tokens';
import { installLocale } from '../../../tests/support/i18n';
import { InMemoryVaultRepository } from '../../../tests/support/in-memory-ports';
import { renderWithProviders } from '../../../tests/support/render';
import { AddTokenView } from './add-token-view';

function setup(repository = new InMemoryVaultRepository()) {
  const onSaved = vi.fn<(id: string, notice?: 'alreadySaved') => void>();
  const onCancel = vi.fn<() => void>();
  const user = userEvent.setup();
  renderWithProviders(<AddTokenView onSaved={onSaved} onCancel={onCancel} />, { repository });
  const field = screen.getByRole('textbox', { name: 'Token' });
  return { user, field, onSaved, onCancel, repository };
}

describe('AddTokenView (US1, FR-001–FR-005)', () => {
  it('labels the field above it and describes it with helper text', () => {
    const { field } = setup();

    expect(field).toHaveAccessibleDescription(/A leading "Bearer " is removed/u);
  });

  it('saves a pasted token and opens it', async () => {
    const { user, field, onSaved, repository } = setup();

    await user.click(field);
    await user.paste(`Bearer ${valid1h}`);
    await user.click(screen.getByRole('button', { name: 'add token' }));

    expect(onSaved).toHaveBeenCalledWith('id-1');
    expect(repository.state.tokens).toHaveLength(1);
  });

  it('submits with Enter and keeps Shift+Enter for new lines', async () => {
    const { user, field, onSaved } = setup();
    await user.click(field);
    await user.paste(valid1h);

    await user.keyboard('{Shift>}{Enter}{/Shift}');
    expect(onSaved).not.toHaveBeenCalled();
    expect(field).toHaveValue(`${valid1h}\n`);

    await user.keyboard('{Enter}');
    expect(onSaved).toHaveBeenCalledWith('id-1');
  });

  it('asks for a token when the field is empty', async () => {
    const { user, onSaved } = setup();

    await user.click(screen.getByRole('button', { name: 'add token' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Paste a token first.');
    expect(onSaved).not.toHaveBeenCalled();
  });

  it.each([
    [malformedCorpus[2].input, 'A JWT has 3 parts separated by dots. This text has 2.'],
    [malformedCorpus[5].input, "The header isn't valid base64url."],
    [malformedCorpus[9].input, "The payload isn't valid JSON."],
    [malformedCorpus[10].input, 'The payload must be a JSON object.'],
    [over64KiB, /This token is \d+ KiB\. The limit is 64 KiB\./u],
  ])('names the exact problem and saves nothing for %#', async (input, message) => {
    const { user, field, onSaved, repository } = setup();
    await user.click(field);
    await user.paste(input);

    await user.click(screen.getByRole('button', { name: 'add token' }));

    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(onSaved).not.toHaveBeenCalled();
    expect(repository.saves).toBe(0);
  });

  it('opens the existing token with a notice instead of saving a duplicate', async () => {
    const repository = new InMemoryVaultRepository();
    const first = setup(repository);
    await first.user.click(first.field);
    await first.user.paste(valid1h);
    await first.user.keyboard('{Enter}');

    await first.user.clear(first.field);
    await first.user.paste(valid1h);
    await first.user.keyboard('{Enter}');

    expect(first.onSaved).toHaveBeenLastCalledWith('id-1', 'alreadySaved');
    expect(repository.state.tokens).toHaveLength(1);
  });

  it('saves and opens an encrypted token', async () => {
    const { user, field, onSaved } = setup();
    await user.click(field);
    await user.paste(jwe5Parts);
    await user.keyboard('{Enter}');

    expect(onSaved).toHaveBeenCalledWith('id-1');
  });

  it('reports a storage failure and keeps the input', async () => {
    const repository = new InMemoryVaultRepository();
    repository.failNextSave = { ok: false, reason: 'quota' };
    const { user, field, onSaved } = setup(repository);
    await user.click(field);
    await user.paste(valid1h);
    await user.keyboard('{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent("The token couldn't be saved.");
    expect(field).toHaveValue(valid1h);
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('can be cancelled', async () => {
    const { user, onCancel } = setup();

    await user.click(screen.getByRole('button', { name: 'cancel' }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('speaks Spanish when the browser does', async () => {
    await installLocale('es');
    const onSaved = vi.fn<(id: string) => void>();
    const user = userEvent.setup();
    renderWithProviders(<AddTokenView onSaved={onSaved} onCancel={vi.fn<() => void>()} />);

    await user.click(screen.getByRole('button', { name: 'agregar token' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Primero pega un token.');
  });
});
