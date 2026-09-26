const BEARER_PREFIX = /^bearer\s+/iu;

/** Removes surrounding whitespace and a leading `Bearer ` scheme (FR-002). */
export function normalizeTokenInput(text: string): string {
  return text.trim().replace(BEARER_PREFIX, '').trim();
}
