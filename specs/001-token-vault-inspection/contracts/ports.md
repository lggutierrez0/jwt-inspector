# Contract: Application ports

Interfaces the application layer depends on. Infrastructure implements them with browser APIs;
tests implement them in memory. Signatures are indicative; exact TypeScript lives in
`src/application/ports`.

## VaultRepository

```ts
interface VaultRepository {
  load(): Promise<VaultLoadResult>; // parsed VaultState + dropped-record count
  save(state: VaultState): Promise<SaveResult>; // single atomic write; typed failure (e.g. quota)
  subscribe(listener: (state: VaultState) => void): Unsubscribe; // changes from any panel
}
```

- `save` failures are values (`{ ok: false, reason: 'quota' | 'unknown' }`), never thrown.
- `subscribe` delivers already-parsed state.
- Implementations: `BrowserVaultRepository` (WXT storage item `local:vault`),
  `InMemoryVaultRepository` (tests; can simulate a second panel and quota errors).

## Clock

```ts
interface Clock {
  now(): number;
} // epoch ms
```

## Clipboard

```ts
interface Clipboard {
  writeText(text: string): Promise<{ ok: boolean }>;
}
```

## IdGenerator

```ts
interface IdGenerator {
  next(): string;
}
```

## Use cases (application layer)

| Use case       | Input            | Result (typed)                                                                                                           |
| -------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `addToken`     | raw text, source | `added { record }` · `duplicate { id }` · `unsupportedJwe { record }`* · `invalid { error: DecodeError }` · `saveFailed` |
| `renameToken`  | id, label        | `renamed` · `invalidLabel { reason: 'empty' \| 'tooLong' }` · `notFound` · `saveFailed`                                  |
| `deleteToken`  | id               | `deleted { record, index }` (for undo) · `notFound` · `saveFailed`                                                       |
| `restoreToken` | record, index    | `restored` · `duplicate` · `saveFailed`                                                                                  |
| `clearAll`     | —                | `cleared { count }` · `saveFailed`                                                                                       |
| `clearExpired` | now              | `cleared { count }` · `saveFailed`                                                                                       |

\* JWE tokens are saved (kind `jwe`) so they appear in the list with a "not supported yet" state
in the detail view; they are not rejected (FR-004).
