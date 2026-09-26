import { createContext, useContext } from 'react';

import { i18n } from '#i18n';

export type Translate = typeof i18n.t;

export interface I18nValue {
  readonly t: Translate;
  /** BCP 47 tag used for Intl formatting; follows the browser UI language (FR-025). */
  readonly locale: string;
}

export const I18nContext = createContext<I18nValue | null>(null);

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (value === null) throw new Error('useI18n must be used inside an I18nContext provider');
  return value;
}

/** Production translator: WXT's typed i18n over `browser.i18n`. */
export function createBrowserI18n(): I18nValue {
  return { t: i18n.t, locale: browser.i18n.getUILanguage() };
}
