import { storage } from 'wxt/utils/storage';

import type {
  LocalePreferenceRepository,
  SupportedLocale,
} from '@/application/ports/locale-preference-repository';

/** A manual language override (FR-029), its own item so it is unrelated to the vault lifecycle. */
const localeItem = storage.defineItem<SupportedLocale | null>('local:localePreference', {
  fallback: null,
});

export class BrowserLocalePreferenceRepository implements LocalePreferenceRepository {
  load(): Promise<SupportedLocale | null> {
    return localeItem.getValue();
  }

  async save(locale: SupportedLocale | null): Promise<void> {
    await localeItem.setValue(locale);
  }
}
