import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { i18n } from '#i18n';
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
 * synchronously with no per-toggle fetch and no flash of missing text. Before that preload
 * settles (a local fetch, but never instant in a real browser), the panel paints immediately
 * with the browser's own translator for the same detected locale, so opening the panel is never
 * gated on a network-shaped round trip (SC-001).
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

  const value = useMemo<I18nValue>(() => {
    if (messages === null) {
      // Fallback: the real browser.i18n for the detected locale, identical to what shipped
      // before this provider existed, and to what this same provider settles into once loaded.
      return { t: i18n.t, locale: detectedLocale, localeOverride: null, setLocale };
    }
    const locale = override ?? detectedLocale;
    return {
      t: createTranslator(messages[locale]),
      locale,
      localeOverride: override,
      setLocale,
    };
  }, [messages, override, detectedLocale, setLocale]);

  return <I18nContext value={value}>{children}</I18nContext>;
}

export { LOCALES };
