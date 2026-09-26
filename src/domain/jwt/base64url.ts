const BASE64URL = /^[A-Za-z0-9_-]*={0,2}$/u;

export type Base64UrlFailure = 'alphabet' | 'utf8';

export type Base64UrlResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly reason: Base64UrlFailure };

const utf8 = new TextDecoder('utf-8', { fatal: true });

/** True when the segment only uses the base64url alphabet and has a decodable length. */
export function isBase64Url(segment: string): boolean {
  if (!BASE64URL.test(segment)) return false;
  return segment.replace(/=+$/u, '').length % 4 !== 1;
}

function toBytes(segment: string): Uint8Array {
  const base64 = segment.replace(/=+$/u, '').replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  return Uint8Array.from(binary, (char) => char.codePointAt(0) ?? 0);
}

/** Decodes a base64url segment into UTF-8 text, failing on any invalid byte sequence. */
export function decodeBase64UrlText(segment: string): Base64UrlResult {
  if (!isBase64Url(segment)) return { ok: false, reason: 'alphabet' };
  try {
    return { ok: true, value: utf8.decode(toBytes(segment)) };
  } catch {
    return { ok: false, reason: 'utf8' };
  }
}
