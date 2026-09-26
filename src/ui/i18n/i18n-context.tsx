import { createContext, useContext } from 'react';

import { i18n } from '#i18n';
import type { SupportedLocale } from '@/application/ports/locale-preference-repository';

export type Translate = typeof i18n.t;

export interface I18nValue {
  readonly t: Translate;
  /** BCP 47 tag used for Intl formatting; follows the browser UI language (FR-025). */
  readonly locale: string;
  /** The effective override, or `null` when following the browser language. */
  readonly localeOverride: SupportedLocale | null;
  /** Switches language and persists the choice (FR-029); `null` reverts to the browser language. */
  readonly setLocale: (locale: SupportedLocale | null) => void;
}

export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (value === null) throw new Error('useI18n must be used inside an I18nContext provider');
  return value;
}

/**
 * The browser's own UI language as a BCP 47 tag (`@@ui_locale`, e.g. "es" or "pt_BR"), falling
 * back to `getUILanguage()` when the fake browser in tests leaves it empty. Used only to pick a
 * default `SupportedLocale` (`detectSupportedLocale`, FR-025); actual messages always come from
 * `SwitchableI18nProvider`, so text and formatting never mix languages by construction.
 */
export function detectBrowserLocaleTag(): string {
  const messagesLocale = i18n.t('@@ui_locale').replace('_', '-');
  return messagesLocale === '' ? browser.i18n.getUILanguage() : messagesLocale;
}
