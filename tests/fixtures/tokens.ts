/**
 * Test tokens built at runtime. They are synthetic (never real credentials) and anchored to a
 * fixed clock so every time-based assertion is deterministic.
 */

/** 2026-09-26T12:00:00.000Z */
export const NOW = Date.UTC(2026, 8, 26, 12, 0, 0);
const S = 1000;
const MIN = 60 * S;
const H = 60 * MIN;
const D = 24 * H;

/** NumericDate (seconds) for an epoch-ms instant. */
export const seconds = (epochMs: number): number => epochMs / 1000;

export function encodeSegment(value: unknown): string {
  const bytes = new TextEncoder().encode(typeof value === 'string' ? value : JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) binary += String.fromCodePoint(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

interface JwsParts {
  readonly header?: Record<string, unknown>;
  readonly payload: Record<string, unknown>;
  readonly signature?: string;
}

export function makeJws({
  header = { alg: 'HS256', typ: 'JWT' },
  payload,
  signature = 'c2lnbmF0dXJl',
}: JwsParts): string {
  return `${encodeSegment(header)}.${encodeSegment(payload)}.${signature}`;
}

export const valid1h = makeJws({
  payload: {
    sub: '8f2c-41',
    iss: 'auth.example.test',
    aud: 'api',
    iat: seconds(NOW - 2 * H),
    exp: seconds(NOW + H),
  },
});

export const expiringIn30s = makeJws({
  payload: { sub: 'soon', iat: seconds(NOW - H), exp: seconds(NOW + 30 * S) },
});

export const expired3d = makeJws({
  payload: { sub: 'old', iat: seconds(NOW - 4 * D), exp: seconds(NOW - 3 * D) },
});

export const notYetValid = makeJws({
  payload: {
    sub: 'later',
    iat: seconds(NOW),
    nbf: seconds(NOW + 2 * H),
    exp: seconds(NOW + 4 * H),
  },
});

export const noExp = makeJws({ payload: { sub: 'forever', iat: seconds(NOW - H) } });

export const noIatNoNbf = makeJws({ payload: { sub: 'unknown-life', exp: seconds(NOW + H) } });

export const algNoneEmptySig = makeJws({
  header: { alg: 'none' },
  payload: { sub: 'unsigned' },
  signature: '',
});

export const large16kb = makeJws({
  payload: { sub: 'big', exp: seconds(NOW + H), blob: 'x'.repeat(16 * 1024) },
});

export const unicodeClaims = makeJws({
  payload: { name: 'Zoë Ñúñez 李雷', note: '🔐 ключ', exp: seconds(NOW + H) },
});

export const invalidTimeClaims = makeJws({
  payload: { sub: 'weird-times', exp: 'tomorrow', iat: -5, nbf: Number.NaN },
});

export const expBeforeIat = makeJws({
  payload: { sub: 'backwards', iat: seconds(NOW), exp: seconds(NOW - H) },
});

export const withPersonalClaims = makeJws({
  payload: {
    sub: 'u-17',
    email: 'maria@example.test',
    name: 'María Example',
    phone_number: '+1 555 0100',
    roles: ['admin'],
    credentials: { apiKey: 'k-123', scope: 'read' },
    exp: seconds(NOW + H),
  },
});

export const jwe5Parts = [
  encodeSegment({ alg: 'RSA-OAEP', enc: 'A256GCM' }),
  'ZW5jcnlwdGVka2V5',
  'aXY',
  'Y2lwaGVydGV4dA',
  'dGFn',
].join('.');

/** Normalized size above the persisted-format limit (64 KiB). */
export const over64KiB = makeJws({ payload: { sub: 'huge', blob: 'y'.repeat(70 * 1024) } });

const goodHeader = encodeSegment({ alg: 'HS256' });
const goodPayload = encodeSegment({ sub: '1' });

/** Inputs that must be rejected, with the error each must produce. */
export const malformedCorpus = [
  { input: '', error: { kind: 'empty' } },
  { input: 'onlyonepart', error: { kind: 'wrongPartCount', count: 1 } },
  { input: `${goodHeader}.${goodPayload}`, error: { kind: 'wrongPartCount', count: 2 } },
  { input: `${goodHeader}.${goodPayload}.sig.extra`, error: { kind: 'wrongPartCount', count: 4 } },
  { input: 'a.b.c.d.e.f', error: { kind: 'wrongPartCount', count: 6 } },
  {
    input: `${goodHeader}+.${goodPayload}.sig`,
    error: { kind: 'invalidBase64Url', part: 'header' },
  },
  {
    input: `${goodHeader}.${goodPayload}/.sig`,
    error: { kind: 'invalidBase64Url', part: 'payload' },
  },
  {
    input: `${goodHeader}.${goodPayload}.si=g`,
    error: { kind: 'invalidBase64Url', part: 'signature' },
  },
  {
    input: `${encodeSegment('{not json')}.${goodPayload}.sig`,
    error: { kind: 'invalidJson', part: 'header' },
  },
  {
    input: `${goodHeader}.${encodeSegment('{"a":')}.sig`,
    error: { kind: 'invalidJson', part: 'payload' },
  },
  {
    input: `${goodHeader}.${encodeSegment([1, 2])}.sig`,
    error: { kind: 'notAnObject', part: 'payload' },
  },
  {
    input: `${encodeSegment('"text"')}.${goodPayload}.sig`,
    error: { kind: 'notAnObject', part: 'header' },
  },
] as const;
