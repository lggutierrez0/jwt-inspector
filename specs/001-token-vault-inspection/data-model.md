# Data Model: Token Vault & Inspection

Stored data is minimal (FR-021); everything else is derived by pure domain functions at render
time. Types below are conceptual; TypeScript definitions live in `src/domain`.

## Stored

### VaultState (storage item `local:vault`, schema version 1)

| Field    | Type            | Rules                                                                  |
| -------- | --------------- | ---------------------------------------------------------------------- |
| `tokens` | `TokenRecord[]` | Ordered most recently added first (FR-007). Unique `id`, unique `raw`. |

Migrations: keyed by version number; v1 is the initial schema. Reads are parsed with the
valibot schema; a record failing the schema is dropped and reported (never crashes the panel).

### LocalePreference (storage item `local:localePreference`, FR-029)

| Field    | Type                   | Rules                                                              |
| -------- | ---------------------- | ------------------------------------------------------------------ |
| `locale` | `'en' \| 'es' \| null` | `null` (the default) means "follow the browser language" (FR-025). |

A separate item from the vault: unrelated lifecycle (never cleared by "clear all"), same storage
area (`local`, never `sync`).

### TokenRecord

| Field     | Type             | Rules                                                                         |
| --------- | ---------------- | ----------------------------------------------------------------------------- |
| `id`      | `string`         | Opaque, generated (`crypto.randomUUID()`), immutable.                         |
| `raw`     | `string`         | Normalized token text (trimmed, `Bearer ` removed). Unique in vault (FR-005). |
| `kind`    | `'jws' \| 'jwe'` | Determined at add time by the decoder.                                        |
| `label`   | `string`         | 1–60 chars after trim (FR-017). Default from FR-011 at add time.              |
| `source`  | `TokenSource`    | See below.                                                                    |
| `addedAt` | `number`         | Epoch milliseconds, from the `Clock` port.                                    |

Not stored: decoded header/payload, status, lifetime, masked state — all derived.

### TokenSource (discriminated union by `kind`)

| `kind`           | Extra fields (optional unless noted) | Produced by |
| ---------------- | ------------------------------------ | ----------- |
| `manual`         | —                                    | 001         |
| `created`        | —                                    | 004         |
| `cookie`         | `origin`, `name`                     | 005         |
| `localStorage`   | `origin`, `key`                      | 005         |
| `sessionStorage` | `origin`, `key`                      | 005         |
| `requestHeader`  | `origin`, `name`                     | 006         |
| `urlParameter`   | `origin`, `name`                     | 006         |
| `body`           | `origin`                             | 007         |
| `consoleLog`     | `origin`                             | 007         |

001 accepts every kind in the schema (so later features only add producers) but only produces
`manual`. The UI badge renders every kind.

## Derived (domain, pure)

### DecodeResult

```
DecodeResult =
  | { ok: true,  token: DecodedJws }
  | { ok: true,  token: RecognizedJwe }
  | { ok: false, error: DecodeError }
```

- **DecodedJws**: `header: JsonObject`, `payload: JsonObject`, `signature: string` (base64url,
  may be empty), `segments: [string, string, string]` (encoded, for the token strip).
- **RecognizedJwe**: `header: JsonObject` (protected header only), `partCount: 5`.
- **DecodeError** (each maps to one i18n message, FR-003):
  `empty` · `wrongPartCount { count }` · `invalidBase64Url { part: 'header'|'payload'|'signature' }`
  · `invalidUtf8 { part }` · `invalidJson { part }` · `notAnObject { part }` · `tooLarge { bytes }`
  (normalized token > 64 KiB, the persisted-format limit).

### NormalizedInput

`normalizeTokenInput(text) → string`: trim, strip leading `Bearer ` (case-insensitive), trim
again (FR-002).

### TimeClaims

Read from the payload: `iat`, `nbf`, `exp` as `NumericDate` when they are finite non-negative
numbers (fractions allowed); otherwise flagged `invalid` with the original value kept for
display (edge case).

### TokenStatus (evaluated with `now`)

| Status         | Condition                        |
| -------------- | -------------------------------- |
| `notYetValid`  | `nbf` present and `now < nbf`    |
| `expired`      | `exp` present and `now ≥ exp`    |
| `valid`        | otherwise, when `exp` present    |
| `neverExpires` | no `exp` (and not `notYetValid`) |

`expiringSoon` is a presentation flag on `valid`: remaining ≤ 10% of lifetime or ≤ 5 minutes.
Invalid time claims never produce a confident status: the status is computed from the valid
claims only and a warning is attached.

### Lifetime

`total = exp − iat`, else `exp − nbf`, else `unknown`; `none` without `exp` (FR-009).
`consumedRatio = clamp((now − start) / total, 0, 1)` when `total` is known.

### DefaultLabel

First non-empty string among `preferred_username`, `sub`, `iss`, truncated to 60 chars; otherwise
`Token N` with the smallest N ≥ 1 not used by an existing `Token N` label (FR-011). Personal data
(`name`, `email`, …) is never used: labels are always visible and FR-015 masks that data.

### Sensitivity

`isSensitiveClaim(path: string[]) → boolean` (FR-015): true when the last path segment is one
of the personal-data claims, or when any segment contains `password`, `secret`, `token` or `key`
(case-insensitive). The signature is always masked.

### ClaimInfo

Catalog of registered claims and header parameters → i18n key of the one-line explanation
(FR-014). Unknown names → `custom`.

## State transitions (UI)

```
list ──Add──▶ add ──valid──▶ detail(id)          (duplicate → detail(existing id) with "already saved" notice)
list ──select──▶ detail(id) ──back──▶ list        (scroll restored)
detail(id) ──delete──▶ list + undo(record, index, 5s) ──undo──▶ list (restored)
any screen ──clear all / clear expired──▶ confirm ──ok──▶ list (if a detail was open, its token
                                                                 is now gone: same guard as below)
any screen ──[ ? ]──▶ info ──back──▶ the screen info was opened from
```

Vault changes from other panels, or a clear command run from the currently open detail, arrive
through the repository subscription; if the open detail's token disappears, the view returns to
the list (same guard, one code path, US5 AS5).

### NavCommand (UI, not persisted)

The command bar (FR-027) is built from a list of `{ key, label, tone?, onSelect }` entries
composed by the shell from the current screen and vault state, so a later feature adds an entry
without editing the bar itself.
