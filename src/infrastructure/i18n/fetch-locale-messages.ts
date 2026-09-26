import * as v from 'valibot';

import type { SupportedLocale } from '@/application/ports/locale-preference-repository';
import type { LocaleMessages } from '@/ui/i18n/translate';

// Chrome's own compiled format (`chrome.i18n._locales/*/messages.json`): a flat map of message
// name to at least a `message` string. Parsed at this boundary (constitution, "parse don't
// validate") since the file is fetched at runtime, not imported.
const localeMessagesSchema = v.record(v.string(), v.looseObject({ message: v.string() }));

/**
 * Reads the already-built `_locales/<locale>/messages.json` from the extension bundle. Used to
 * translate in a language other than the browser's own, since `browser.i18n.getMessage` cannot
 * be pointed at a locale other than the extension's UI language (FR-029).
 */
export async function loadLocaleMessages(locale: SupportedLocale): Promise<LocaleMessages> {
  // Relative to the extension's own origin, resolved the same way in Chromium and Firefox;
  // `_locales` is a static bundled resource, not a WXT entrypoint, so `runtime.getURL`'s typed
  // (entrypoint-only) overloads do not apply here.
  const url = new URL(`/_locales/${locale}/messages.json`, location.href);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load locale messages for "${locale}" (${String(response.status)})`);
  }
  return v.parse(localeMessagesSchema, await response.json());
}
