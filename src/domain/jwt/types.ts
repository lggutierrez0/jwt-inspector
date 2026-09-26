export type JsonValue = string | number | boolean | null | JsonValue[] | JsonObject;
export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export type TokenPart = 'header' | 'payload' | 'signature';

/** A signed token (JWS compact serialization). */
export interface DecodedJws {
  readonly kind: 'jws';
  readonly header: JsonObject;
  readonly payload: JsonObject;
  /** base64url signature; empty for unsigned tokens. */
  readonly signature: string;
  /** The three encoded segments, in order. */
  readonly segments: readonly [string, string, string];
}

/** An encrypted token (JWE compact serialization): recognized, not decrypted (FR-004). */
export interface RecognizedJwe {
  readonly kind: 'jwe';
  readonly header: JsonObject;
  readonly partCount: 5;
}

export type DecodedToken = DecodedJws | RecognizedJwe;

export type DecodeError =
  | { readonly kind: 'empty' }
  | { readonly kind: 'wrongPartCount'; readonly count: number }
  | { readonly kind: 'invalidBase64Url'; readonly part: TokenPart }
  | { readonly kind: 'invalidUtf8'; readonly part: TokenPart }
  | { readonly kind: 'invalidJson'; readonly part: TokenPart }
  | { readonly kind: 'notAnObject'; readonly part: TokenPart }
  | { readonly kind: 'tooLarge'; readonly bytes: number };

export type DecodeResult =
  | { readonly ok: true; readonly token: DecodedToken }
  | { readonly ok: false; readonly error: DecodeError };
