/** Where a token came from. Only `manual` is produced in 001; the rest arrive with 004–007. */
export const TOKEN_SOURCE_KINDS = [
  'manual',
  'created',
  'cookie',
  'localStorage',
  'sessionStorage',
  'requestHeader',
  'urlParameter',
  'body',
  'consoleLog',
] as const;

/** Labels are 1–60 characters after trimming (FR-017). */
export const LABEL_MAX_LENGTH = 60;

export type TokenSourceKind = (typeof TOKEN_SOURCE_KINDS)[number];

export interface TokenSource {
  readonly kind: TokenSourceKind;
  /** Page origin for automatic sources. */
  readonly origin?: string;
  /** Cookie, header or URL parameter name. */
  readonly name?: string;
  /** Storage key. */
  readonly key?: string;
}

export interface TokenRecord {
  readonly id: string;
  /** Normalized token text; unique in the vault. */
  readonly raw: string;
  readonly kind: 'jws' | 'jwe';
  readonly label: string;
  readonly source: TokenSource;
  /** Epoch milliseconds. */
  readonly addedAt: number;
}

/** Tokens ordered most recently added first. */
export interface VaultState {
  readonly tokens: readonly TokenRecord[];
}

export const EMPTY_VAULT: VaultState = { tokens: [] };

export function prependRecord(state: VaultState, record: TokenRecord): VaultState {
  return { tokens: [record, ...state.tokens] };
}

export function findByRaw(state: VaultState, raw: string): TokenRecord | undefined {
  return state.tokens.find((token) => token.raw === raw);
}

export function findById(state: VaultState, id: string): TokenRecord | undefined {
  return state.tokens.find((token) => token.id === id);
}
