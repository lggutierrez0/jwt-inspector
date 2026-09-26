import {
  algNoneEmptySig,
  encodeSegment,
  jwe5Parts,
  malformedCorpus,
  over64KiB,
  valid1h,
} from '../../../tests/fixtures/tokens';
import { decodeToken, MAX_TOKEN_BYTES } from './decode';

describe('decodeToken (FR-003, FR-004)', () => {
  it('decodes a signed token into header, payload, signature and segments', () => {
    expect(decodeToken(valid1h)).toMatchObject({
      ok: true,
      token: {
        kind: 'jws',
        header: { alg: 'HS256', typ: 'JWT' },
        payload: { sub: '8f2c-41', aud: 'api' },
        signature: 'c2lnbmF0dXJl',
        segments: valid1h.split('.'),
      },
    });
  });

  it('accepts an empty signature (alg none)', () => {
    const result = decodeToken(algNoneEmptySig);

    expect(result).toMatchObject({ ok: true, token: { kind: 'jws', signature: '' } });
  });

  it('decodes a header without alg (flagged later by the security score)', () => {
    const token = `${encodeSegment({ typ: 'JWT' })}.${encodeSegment({ sub: '1' })}.sig`;

    expect(decodeToken(token)).toMatchObject({ ok: true, token: { header: { typ: 'JWT' } } });
  });

  it('recognizes a five-part token with enc as an encrypted token', () => {
    expect(decodeToken(jwe5Parts)).toEqual({
      ok: true,
      token: { kind: 'jwe', header: { alg: 'RSA-OAEP', enc: 'A256GCM' }, partCount: 5 },
    });
  });

  it('rejects five parts whose header is not a JWE header', () => {
    const fake = [encodeSegment({ alg: 'HS256' }), 'a', 'b', 'c', 'd'].join('.');

    expect(decodeToken(fake)).toEqual({ ok: false, error: { kind: 'wrongPartCount', count: 5 } });
  });

  it.each(malformedCorpus)('rejects $input with $error.kind', ({ input, error }) => {
    expect(decodeToken(input)).toEqual({ ok: false, error });
  });

  it('reports invalid UTF-8 with the part that contains it', () => {
    const token = `${encodeSegment({ alg: 'HS256' })}.__4.sig`;

    expect(decodeToken(token)).toEqual({
      ok: false,
      error: { kind: 'invalidUtf8', part: 'payload' },
    });
  });

  it('rejects tokens over the persisted-format limit', () => {
    expect(decodeToken(over64KiB)).toEqual({
      ok: false,
      error: { kind: 'tooLarge', bytes: new TextEncoder().encode(over64KiB).length },
    });
  });

  it('accepts a token of exactly the limit size', () => {
    const header = encodeSegment({ alg: 'none' });
    const filler = 'a'.repeat(MAX_TOKEN_BYTES - header.length - 2 - 'e30'.length);
    const token = `${header}.e30.${filler}`;

    expect(new TextEncoder().encode(token).length).toBe(MAX_TOKEN_BYTES);
    expect(decodeToken(token).ok).toBe(true);
  });
});
