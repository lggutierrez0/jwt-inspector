import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useContext } from 'react';

import { InMemoryLocalePreferenceRepository } from '../../../tests/support/in-memory-ports';
import { I18nContext } from './i18n-context';
import { SwitchableI18nProvider } from './switchable-i18n';

const MESSAGES = {
  en: { greeting: { message: 'Hello' } },
  es: { greeting: { message: 'Hola' } },
};

function loadMessages(locale: 'en' | 'es') {
  return Promise.resolve(MESSAGES[locale]);
}

function Probe() {
  const value = useContext(I18nContext);
  if (value === null) return null;
  const t = value.t as (key: string) => string;
  return (
    <div>
      <span data-testid="locale">{value.locale}</span>
      <span data-testid="override">{value.localeOverride ?? 'none'}</span>
      <span data-testid="text">{t('greeting')}</span>
      <button
        onClick={() => {
          value.setLocale('es');
        }}
      >
        Spanish
      </button>
      <button
        onClick={() => {
          value.setLocale(null);
        }}
      >
        Follow browser
      </button>
    </div>
  );
}

async function renderProvider(repository = new InMemoryLocalePreferenceRepository()) {
  render(
    <SwitchableI18nProvider detectedLocale="en" loadMessages={loadMessages} repository={repository}>
      <Probe />
    </SwitchableI18nProvider>,
  );
  await screen.findByTestId('text');
  return repository;
}

describe('SwitchableI18nProvider (FR-029)', () => {
  it('defaults to the detected browser locale with no saved override', async () => {
    await renderProvider();

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('override')).toHaveTextContent('none');
    expect(screen.getByTestId('text')).toHaveTextContent('Hello');
  });

  it('loads a previously saved override on mount', async () => {
    await renderProvider(new InMemoryLocalePreferenceRepository('es'));

    expect(screen.getByTestId('locale')).toHaveTextContent('es');
    expect(screen.getByTestId('text')).toHaveTextContent('Hola');
  });

  it('setLocale switches synchronously (both locales preloaded) and persists the choice', async () => {
    const user = userEvent.setup();
    const repository = await renderProvider();

    await user.click(screen.getByRole('button', { name: 'Spanish' }));

    expect(screen.getByTestId('locale')).toHaveTextContent('es');
    expect(screen.getByTestId('text')).toHaveTextContent('Hola');
    await expect(repository.load()).resolves.toBe('es');
  });

  it('setLocale(null) reverts to the detected locale and clears the persisted override', async () => {
    const user = userEvent.setup();
    const repository = await renderProvider(new InMemoryLocalePreferenceRepository('es'));

    await act(async () => {
      await user.click(screen.getByRole('button', { name: 'Follow browser' }));
    });

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('override')).toHaveTextContent('none');
    await expect(repository.load()).resolves.toBeNull();
  });
});
