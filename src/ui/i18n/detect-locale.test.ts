import { detectSupportedLocale } from './detect-locale';

describe('detectSupportedLocale (FR-025 fallback)', () => {
  it.each(['es', 'es-ES', 'es_MX', 'ES', 'es-419'])('maps %s to Spanish', (tag) => {
    expect(detectSupportedLocale(tag)).toBe('es');
  });

  it.each(['en', 'en-US', 'fr', 'de-DE', '', undefined])('falls back to English for %s', (tag) => {
    expect(detectSupportedLocale(tag)).toBe('en');
  });
});
