import { decodeBase64UrlText } from './base64url';

describe('decodeBase64UrlText', () => {
  it('decodes unpadded base64url into UTF-8 text', () => {
    expect(decodeBase64UrlText('eyJhIjoxfQ')).toEqual({ ok: true, value: '{"a":1}' });
  });

  it('accepts the URL-safe alphabet (- and _)', () => {
    // 0xfb 0xff 0xbf -> "-_-_" in base64url; decoding the bytes then fails UTF-8, proving `-`/`_` were read
    expect(decodeBase64UrlText('-_-_')).toEqual({ ok: false, reason: 'utf8' });
  });

  it('decodes multi-byte UTF-8', () => {
    expect(decodeBase64UrlText('w7E')).toEqual({ ok: true, value: 'ñ' });
  });

  it.each(['ab+c', 'ab/c', 'ab=c', 'ab c', 'ab\nc', 'abç', 'a'])(
    'rejects characters or lengths outside base64url: %j',
    (segment) => {
      expect(decodeBase64UrlText(segment)).toEqual({ ok: false, reason: 'alphabet' });
    },
  );

  it('accepts trailing padding', () => {
    expect(decodeBase64UrlText('w7E=')).toEqual({ ok: true, value: 'ñ' });
  });

  it('fails on invalid UTF-8 sequences instead of replacing them', () => {
    expect(decodeBase64UrlText('__4')).toEqual({ ok: false, reason: 'utf8' });
  });

  it('decodes the empty segment to an empty string', () => {
    expect(decodeBase64UrlText('')).toEqual({ ok: true, value: '' });
  });
});
