import { decodeBase64UrlText, isBase64Url } from './base64url';
import type { DecodeError, DecodeResult, JsonObject, TokenPart } from './types';

/** Largest normalized token accepted: the persisted-format limit (contracts/storage-vault-v1.md). */
export const MAX_TOKEN_BYTES = 64 * 1024;

type ObjectResult =
  | { readonly ok: true; readonly value: JsonObject }
  | { readonly ok: false; readonly error: DecodeError };

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function decodeObject(segment: string, part: TokenPart): ObjectResult {
  const text = decodeBase64UrlText(segment);
  if (!text.ok) {
    const kind = text.reason === 'alphabet' ? 'invalidBase64Url' : 'invalidUtf8';
    return { ok: false, error: { kind, part } };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text.value);
  } catch {
    return { ok: false, error: { kind: 'invalidJson', part } };
  }
  return isJsonObject(parsed)
    ? { ok: true, value: parsed }
    : { ok: false, error: { kind: 'notAnObject', part } };
}

function decodeJwe(segments: readonly string[]): DecodeResult {
  const [first = ''] = segments;
  const header = decodeObject(first, 'header');
  if (header.ok && typeof header.value['enc'] === 'string') {
    return { ok: true, token: { kind: 'jwe', header: header.value, partCount: 5 } };
  }
  return { ok: false, error: { kind: 'wrongPartCount', count: 5 } };
}

/**
 * Decodes a normalized compact token. Signed tokens are fully decoded; encrypted tokens are
 * recognized from their protected header. Every failure names its reason (FR-003).
 */
export function decodeToken(raw: string): DecodeResult {
  if (raw.length === 0) return { ok: false, error: { kind: 'empty' } };

  const bytes = new TextEncoder().encode(raw).length;
  if (bytes > MAX_TOKEN_BYTES) return { ok: false, error: { kind: 'tooLarge', bytes } };

  const segments = raw.split('.');
  if (segments.length === 5) return decodeJwe(segments);
  if (segments.length !== 3) {
    return { ok: false, error: { kind: 'wrongPartCount', count: segments.length } };
  }

  const [headerSegment = '', payloadSegment = '', signature = ''] = segments;
  const header = decodeObject(headerSegment, 'header');
  if (!header.ok) return header;
  const payload = decodeObject(payloadSegment, 'payload');
  if (!payload.ok) return payload;
  if (!isBase64Url(signature)) {
    return { ok: false, error: { kind: 'invalidBase64Url', part: 'signature' } };
  }

  return {
    ok: true,
    token: {
      kind: 'jws',
      header: header.value,
      payload: payload.value,
      signature,
      segments: [headerSegment, payloadSegment, signature],
    },
  };
}
