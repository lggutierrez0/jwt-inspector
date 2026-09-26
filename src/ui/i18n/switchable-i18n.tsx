import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import type {
  LocalePreferenceRepository,
  SupportedLocale,
} from '@/application/ports/locale-preference-repository';

import { I18nContext, type I18nValue } from './i18n-context';
import { createTranslator, type LocaleMessages } from './translate';

const LOCALES = ['en', 'es'] as const satisfies readonly SupportedLocale[];

interface SwitchableI18nProviderProps {
  /** The browser's language mapped to a shipped locale (FR-025), used with no saved override. */
  readonly detectedLocale: SupportedLocale;
  readonly loadMessages: (locale: SupportedLocale) => Promise<LocaleMessages>;
  readonly repository: LocalePreferenceRepository;
  readonly children: ReactNode;
}

/**
 * Every shipped locale's messages are preloaded once, so `setLocale` (FR-029) switches
 * synchronously with no per-toggle fetch and no flash of missing text.
 */
export function SwitchableI18nProvider({
  detectedLocale,
  loadMessages,
  repository,
  children,
}: SwitchableI18nProviderProps) {
  const [messages, setMessages] = useState<Record<SupportedLocale, LocaleMessages> | null>(null);
  const [override, setOverride] = useState<SupportedLocale | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const [en, es, saved] = await Promise.all([
        loadMessages('en'),
        loadMessages('es'),
        repository.load(),
      ]);
      if (active) {
        setMessages({ en, es });
        setOverride(saved);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [loadMessages, repository]);

  const setLocale = useCallback(
    (locale: SupportedLocale | null) => {
      setOverride(locale);
      void repository.save(locale);
    },
    [repository],
  );

  const value = useMemo<I18nValue | null>(() => {
    if (messages === null) return null;
    const locale = override ?? detectedLocale;
    return {
      t: createTranslator(messages[locale]),
      locale,
      localeOverride: override,
      setLocale,
    };
  }, [messages, override, detectedLocale, setLocale]);

  // Both locale files are small, local extension resources: this is not a visible loading state
  // in practice, only a brief absence of the tree while the first fetch settles.
  if (value === null) return null;

  return <I18nContext value={value}>{children}</I18nContext>;
}

export { LOCALES };
