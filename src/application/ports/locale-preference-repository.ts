/** A locale this extension ships translations for (matches `src/locales/*.yml`). */
export type SupportedLocale = 'en' | 'es';

/**
 * A manual language override (FR-029), separate from the vault: `null` means "follow the
 * browser language" (FR-025). Failures are not surfaced to the user (contracts/ports.md): worst
 * case the override does not persist and the panel falls back to the browser language.
 */
export interface LocalePreferenceRepository {
  load(): Promise<SupportedLocale | null>;
  save(locale: SupportedLocale | null): Promise<void>;
}
