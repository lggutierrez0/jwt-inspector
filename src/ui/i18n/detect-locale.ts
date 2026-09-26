import type { SupportedLocale } from '@/application/ports/locale-preference-repository';

export type { SupportedLocale };

/** Maps a BCP 47 / Chrome locale tag to a shipped locale, English otherwise (FR-025). */
export function detectSupportedLocale(uiLanguage: string | undefined): SupportedLocale {
  return (uiLanguage ?? '').toLowerCase().startsWith('es') ? 'es' : 'en';
}
