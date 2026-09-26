---
description: 'Task list for feature 001: Token Vault & Inspection'
---

# Tasks: Token Vault & Inspection

**Input**: Design documents from `/specs/001-token-vault-inspection/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md,
DESIGN.md, `.impeccable/surfaces/src-entrypoints-sidepanel-index-html.md` (direction contract)

**Tests**: MANDATORY (constitution Principle I). Every test task is written first, run, and
observed failing for the right reason (the missing behavior, not a typo or import error) before
its implementation task starts. Implementation tasks name the test task(s) they turn green.

**Organization**: grouped by user story so each story is an independently testable increment.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: US1–US4 from spec.md
- Unit/component tests are colocated (`*.test.ts[x]` next to the module); shared doubles and
  fixtures live in `tests/`; E2E journeys in `e2e/`.

## Standing rules for every task

- Red → Green → Refactor. Commit after each green step with a Conventional Commit
  (`test(core): …`, `feat(ui): …`); hooks must pass, never `--no-verify`.
- `src/domain` imports nothing from `wxt`, `react`, `@/infrastructure`, `@/ui` or browser globals.
- Every user-facing string goes into both `src/locales/en.yml` and `src/locales/es.yml`; no
  em-dashes in UI copy (DESIGN.md "Copy voice").
- UI tasks read `DESIGN.md` first and use only its `@theme` tokens (no arbitrary values).
- Expected failures are typed results, never thrown (contracts/ports.md).

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: dependencies, tokens and test infrastructure used by every story.

- [ ] T001 Add exact-pinned dependencies with `pnpm add valibot@1.5.0 @fontsource-variable/martian-mono@5.3.0` and `pnpm add -D @axe-core/playwright@4.13.0`; confirm `pnpm install` passes the supply-chain policies and `pnpm audit:ci` is clean (package.json, pnpm-lock.yaml)
- [ ] T002 Translate DESIGN.md into Tailwind v4 tokens in src/assets/styles/tailwind.css: every color token (light on `:root`, dark under `prefers-color-scheme: dark`), named tints via `color-mix(in oklch, <token> 12%, transparent)`, `--font-mono` = "Martian Mono Variable" with the `wdth` axis utilities (`font-stretch` 75% condensed, 100% normal), type tokens `text-cite` 12/16, `text-body` 13/20, `text-label` 13/20 700, `text-head` 14/20 700, `text-state` 22/26 700, radius 2px, `shadow-float`; import `@fontsource-variable/martian-mono/standard.css`; replace the foundation placeholder tokens (`text-ink-muted`, `border-line`) keeping AppShell green
- [ ] T003 [P] Declare `content_security_policy.extension_pages` = `script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'` in wxt.config.ts (research R13); verify with `pnpm build` that both manifests contain it
- [ ] T004 [P] Pin test time zone: set `process.env.TZ = 'UTC'` in vitest.config.ts (`test.env`) and include `tests/**/*.test.ts` in `test.include`
- [ ] T005 [P] Write architecture test src/architecture.test.ts that reads every file under src/domain and src/application and fails if any imports `wxt`, `#imports`, `react`, `@/infrastructure`, `@/ui` or references `browser.`/`chrome.`/`document`/`window`; run it (passes vacuously now, guards every later task)
- [ ] T006 [P] Create test token factory tests/fixtures/tokens.ts: `encodeSegment(json)` (base64url without padding), `makeJws({ header, payload, signature })`, and named fixtures relative to a fixed `NOW = Date.UTC(2026, 8, 26, 12, 0, 0)`: `valid1h`, `expiringIn30s`, `expired3d`, `notYetValid`, `noExp`, `noIatNoNbf`, `algNoneEmptySig`, `large16kb`, `unicodeClaims`, `invalidTimeClaims` (`exp: "tomorrow"`, `iat: -5`, `exp` before `iat`), `withPersonalClaims` (email, name, phone_number, nested `credentials.apiKey`), `jwe5Parts` (header `{"alg":"RSA-OAEP","enc":"A256GCM"}`), and `malformedCorpus` (1, 2, 4 and 6 parts; bad base64url in each part; bad JSON in header and payload; JSON array payload; empty string). Never real credentials
- [ ] T007 [P] Create YAML-backed translator for tests tests/support/translator.ts that loads src/locales/{en,es}.yml and returns a `t(key, substitutions?, count?)` compatible with the UI i18n context (research R7)
- [ ] T008 [P] Create test render helper tests/support/render.tsx wrapping components with the i18n, clock and services providers (defined in T020–T022) with overridable fakes

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: domain model, decoder, time rules, ports, storage and app shell that every story
uses. **No user-story work starts before this phase is green.**

### Domain: JWT decoding (research R1, data-model "DecodeResult")

- [ ] T009 [P] Write failing tests src/domain/jwt/normalize.test.ts for `normalizeTokenInput(text)`: trims whitespace/newlines, strips a leading `Bearer ` case-insensitively (`bearer`, `BEARER`), trims again, leaves inner content untouched (FR-002)
- [ ] T010 [P] Write failing tests src/domain/jwt/base64url.test.ts for `decodeBase64Url(segment)`: valid unpadded input, accepts `-`/`_`, rejects `+`, `/`, `=` in the middle, whitespace and non-alphabet chars, returns typed failure; UTF-8 decoding is fatal on invalid sequences
- [ ] T011 Write failing tests src/domain/jwt/decode.test.ts for `decodeToken(raw): DecodeResult` using tests/fixtures/tokens.ts: `ok` JWS with header, payload, signature (may be empty) and three `segments`; five parts with `enc` in header → `RecognizedJwe` with `partCount: 5`; every entry of `malformedCorpus` → the exact `DecodeError` (`empty`, `wrongPartCount { count }`, `invalidBase64Url { part }`, `invalidUtf8 { part }`, `invalidJson { part }`, `notAnObject { part }`); header without `alg` still decodes (edge case)
- [ ] T012 [P] Implement src/domain/jwt/normalize.ts (turns T009 green)
- [ ] T013 [P] Implement src/domain/jwt/base64url.ts with `atob` over validated alphabet and `TextDecoder('utf-8', { fatal: true })` (turns T010 green)
- [ ] T014 Implement src/domain/jwt/decode.ts and src/domain/jwt/types.ts (`JsonValue`, `JsonObject`, `DecodedJws`, `RecognizedJwe`, `DecodeError`, `DecodeResult`) (turns T011 green)

### Domain: time (data-model "TimeClaims", "TokenStatus", "Lifetime")

- [ ] T015 [P] Write failing tests src/domain/time/time-claims.test.ts: `readTimeClaims(payload)` returns `iat`/`nbf`/`exp` as epoch ms when they are finite non-negative numbers (fractions allowed) and `{ invalid: originalValue }` otherwise (strings, negatives, `NaN`)
- [ ] T016 [P] Write failing tests src/domain/time/status.test.ts for `evaluateStatus(claims, now)`: `notYetValid` when `nbf` present and `now < nbf`; `expired` when `exp` present and `now ≥ exp` (boundary: exactly at `exp` is expired); `valid` otherwise with `exp`; `neverExpires` without `exp`; `expiringSoon` flag on `valid` when "remaining ≤ 10% of lifetime or ≤ 5 minutes"; invalid claims are ignored for status and produce a warning
- [ ] T017 [P] Write failing tests src/domain/time/lifetime.test.ts: "`total = exp − iat`, else `exp − nbf`, else `unknown`; `none` without `exp`"; `consumedRatio = clamp((now − start) / total, 0, 1)`; and `splitDuration(ms)` → largest two units (`{ d, h }`, `{ h, min }`, `{ min, s }`) for display
- [ ] T018 Implement src/domain/time/time-claims.ts, status.ts, lifetime.ts (turns T015–T017 green)

### Domain and application: vault model, ports, repository

- [ ] T019 [P] Write failing tests src/domain/vault/token-record.test.ts for the record model: `TokenSource` union accepts `manual | created | cookie | localStorage | sessionStorage | requestHeader | urlParameter | body | consoleLog` with optional string context fields (`origin`, `name`, `key`); `VaultState` ordering helper `prependRecord` keeps "most recently added first"; `findByRaw` and `findById`
- [ ] T020 Implement src/domain/vault/token-record.ts (types `TokenRecord { id, raw, kind: 'jws' | 'jwe', label, source, addedAt }`, `TokenSource`, `VaultState { tokens }`) (turns T019 green)
- [ ] T021 [P] Define ports in src/application/ports/{vault-repository,clock,clipboard,id-generator}.ts exactly as contracts/ports.md (`save` returns `{ ok: true } | { ok: false, reason: 'quota' | 'unknown' }`; `subscribe` returns an unsubscribe function)
- [ ] T022 [P] Create in-memory test doubles tests/support/in-memory-ports.ts: `InMemoryVaultRepository` (can simulate a second panel writing and a `quota` failure), `FixedClock` (settable `now`), `RecordingClipboard`, `SequentialIdGenerator`
- [ ] T023 Write failing tests src/infrastructure/storage/vault-schema.test.ts for the valibot schema of contracts/storage-vault-v1.md: accepts the example document; missing item → `{ "tokens": [] }`; drops records that break a rule ("`raw` non-empty string, ≤ 64 KiB", "`label` string, 1–60 chars after trim", "`kind` `\"jws\"` or `\"jwe\"`", "`addedAt` finite number ≥ 0", unknown `source.kind`) and reports the dropped count; duplicate `id` or `raw`: "first occurrence wins"
- [ ] T024 Implement src/infrastructure/storage/vault-schema.ts (turns T023 green)
- [ ] T025 Write failing tests src/infrastructure/storage/browser-vault-repository.test.ts with WXT `fakeBrowser`: `load` parses through the schema and never rewrites storage on read; `save` writes item `local:vault` version 1 atomically and returns `{ ok: false, reason: 'quota' }` when `storage.local.set` rejects with a quota error; `subscribe` fires with parsed state when another context writes the item (FR-022); nothing is written to `storage.sync`
- [ ] T026 Implement src/infrastructure/storage/browser-vault-repository.ts with `storage.defineItem('local:vault', { version: 1, fallback: { tokens: [] }, migrations: {} })` and `watch()` (turns T025 green)
- [ ] T027 [P] Implement src/infrastructure/system/system-clock.ts (`Date.now`) and src/infrastructure/system/crypto-id-generator.ts (`crypto.randomUUID`), each test-first with a colocated `*.test.ts`

### UI foundation (research R5, R7, R10)

- [ ] T028 Write failing tests src/ui/clock/clock-ticker.test.ts with Vitest fake timers: one shared ticker publishes `now` every 1000ms to all subscribers, pauses when `document.visibilityState` is `hidden` and resumes (immediately publishing) when visible, stops when the last subscriber leaves; `useNow()` re-renders subscribers
- [ ] T029 Implement src/ui/clock/clock-ticker.ts and src/ui/clock/use-now.ts with `useSyncExternalStore` (turns T028 green)
- [ ] T030 [P] Write failing tests src/ui/i18n/format.test.ts (TZ=UTC, locales `en` and `es`): `formatRelative(target, now)` via `Intl.RelativeTimeFormat`; `formatAbsolute(epochMs)` with `timeZoneName: 'short'`; `formatDuration(splitDuration)` ("2 h 14 min" / "2 h 14 min" es); `formatTimeLeft` / `formatExpiredAgo`
- [ ] T031 Implement src/ui/i18n/format.ts, src/ui/i18n/i18n-context.tsx (provider exposing `t` and `locale`; production value from `createI18n()` of `#i18n`) (turns T030 green)
- [ ] T032 Write failing tests src/ui/app/view-reducer.test.ts: views `list | add | detail(id, notice?)`; `openAdd`, `openDetail`, `back` (keeps list scroll position value), `tokenRemovedExternally(id)` returns to list when the open detail's token disappears (data-model "State transitions")
- [ ] T033 Implement src/ui/app/view-reducer.ts and src/ui/app/services-context.tsx (provides repository, clock, clipboard, id generator) (turns T032 green)
- [ ] T034 Write failing test src/ui/app/use-vault.test.tsx: `useVault()` loads state once, exposes loading/ready/error, re-renders on repository `subscribe` events, surfaces the dropped-record count once
- [ ] T035 Implement src/ui/app/use-vault.ts (turns T034 green)
- [ ] T036 Update src/ui/app-shell.test.tsx then src/ui/app-shell.tsx: header per DESIGN.md (product name, `v{version}` in `text-cite`), view outlet driven by the reducer, skeleton while the vault loads (index lines as rules, no spinner); keep the two existing assertions green
- [ ] T037 Wire production providers in src/entrypoints/sidepanel/main.tsx (browser repository, system clock, navigator clipboard placeholder from US3, crypto ids, i18n) and set `lang` from the UI locale in src/entrypoints/sidepanel/index.html bootstrap

**Checkpoint**: `pnpm check` green; decoder, time rules, vault persistence and shell work with no
user-visible feature yet.

---

## Phase 3: User Story 1 - Add a token and understand it at a glance (Priority: P1) 🎯 MVP

**Goal**: paste a token, get specific errors or a saved token whose detail shows status, times,
header parameters and claims with explanations and citations.

**Independent Test**: paste each fixture from tests/fixtures/tokens.ts; malformed corpus shows
the exact message and saves nothing; valid tokens open a correct detail (quickstart
"add-and-inspect").

### Tests for User Story 1 (write first, see them fail) ⚠️

- [ ] T038 [P] [US1] Write failing tests src/domain/claims/default-label.test.ts: "First non-empty string among `name`, `email`, `preferred_username`, `sub`, `iss`, truncated to 60 chars; otherwise `Token N` with the smallest N ≥ 1 not used by an existing `Token N` label" (FR-011)
- [ ] T039 [P] [US1] Write failing tests src/domain/claims/claim-catalog.test.ts: registered claims `iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti` map to an i18n explanation key and citation `RFC 7519, Section 4.1.1`–`4.1.7`; header params `alg`, `jku`, `jwk`, `kid`, `x5u`, `x5c`, `x5t`, `x5t#S256`, `typ`, `cty`, `crit` map to `RFC 7515, Section 4.1.1`–`4.1.11`; OpenID personal claims cite `OpenID Connect Core 1.0, Section 5.1`; unknown names → `custom` (FR-014)
- [ ] T040 [US1] Write failing tests src/application/vault/add-token.test.ts with in-memory ports: `added { record }` (source `manual`, default label, `addedAt` from clock, prepended); `duplicate { id }` for an exact normalized match; JWE → `unsupportedJwe { record }` saved with `kind: 'jwe'`; malformed → `invalid { error }` and nothing saved; repository failure → `saveFailed`
- [ ] T041 [P] [US1] Write failing component tests src/ui/views/add-token-view.test.tsx: labeled textarea "Token" (label above, helper text, error below), submit via `[ add token ]` and Enter (Shift+Enter inserts newline); each `DecodeError` shows its specific en/es message; success navigates to detail; duplicate navigates to the existing detail with the "already saved" notice
- [ ] T042 [P] [US1] Write failing component tests src/ui/views/detail-view.test.tsx (FixedClock at NOW): front matter shows Issuer/Subject/Audience and status word + time left; order of sections matches FR-013 (status, timing, lifetime progress when computable, header, payload, raw); expired shows "Expired" with time since; not-yet-valid shows when it becomes valid; no `exp` shows "Never expires" and no ruler; invalid time claims show the raw value with a warning; JWE shows the "not supported yet" state with its protected header; label line shows the record label
- [ ] T043 [P] [US1] Write failing component tests src/ui/components/time-ruler.test.tsx: ten equal divisions; `now` mark position equals `consumedRatio`; before `nbf` the mark sits left with an arrow, after `exp` right; absolute start/end times rendered with time zone name; accessible name summarizes "issued …, expires …, now …"
- [ ] T044 [P] [US1] Write failing component tests src/ui/components/claim-entry.test.tsx: registered claim shows quoted name, title, value, citation in `text-cite`; custom claim shows name and value only; `aud` arrays, nested objects, `null`, booleans and Unicode render faithfully; long values wrap without horizontal page scroll

### Implementation for User Story 1

- [ ] T045 [P] [US1] Implement src/domain/claims/default-label.ts (turns T038 green)
- [ ] T046 [P] [US1] Implement src/domain/claims/claim-catalog.ts (turns T039 green)
- [ ] T047 [US1] Implement src/application/vault/add-token.ts (turns T040 green)
- [ ] T048 [US1] Implement src/ui/views/add-token-view.tsx and its en/es messages (turns T041 green)
- [ ] T049 [P] [US1] Implement src/ui/components/time-ruler.tsx per DESIGN.md "Time ruler" (turns T043 green)
- [ ] T050 [P] [US1] Implement src/ui/components/claim-entry.tsx and src/ui/components/json-view.tsx (React elements only, no `dangerouslySetInnerHTML`) (turns T044 green)
- [ ] T051 [US1] Implement src/ui/views/detail-view.tsx with front matter, structure figure (segments colored by part, signature shown as-is until US3 adds masking), header/payload sections, raw section (turns T042 green)
- [ ] T052 [US1] Add the header `[ add token ]` command and add/detail routing in src/ui/app-shell.tsx (update its test first)
- [ ] T053 [US1] Write E2E journey e2e/add-and-inspect.spec.ts covering US1 AS1–AS8 and SC-001 (≤ 3 interactions) and SC-002 (status visible without scrolling at 320px viewport); run `pnpm test:e2e`

**Checkpoint**: MVP. A user can add and inspect tokens privately.

---

## Phase 4: User Story 2 - See all my tokens and their remaining life (Priority: P2)

**Goal**: the index view listing every token with label, tail, source, live time left and
total lifetime.

**Independent Test**: seed the in-memory repository with fixtures; verify each index line and its
live updates (quickstart "list-overview").

### Tests for User Story 2 ⚠️

- [ ] T054 [P] [US2] Write failing component tests src/ui/components/index-line.test.tsx: label, dotted leader, time left colored by status (plus status word), second line tail `...` + last 8 characters, source name for every `TokenSource` kind, lifetime (`Unknown`, `Never expires`); whole line is one button with an accessible name including label and status
- [ ] T055 [US2] Write failing component tests src/ui/views/list-view.test.tsx (fake timers): most recently added first (FR-007); time left updates each second while visible and flips to "Expired" within 1s of `exp` (FR-010, SC-007); empty state with purpose text and `[ add token ]` (FR-012); selecting by click or Enter opens detail; back restores scroll position; toolbar shows the count
- [ ] T056 [US2] Write failing performance test src/ui/views/list-view.perf.test.tsx: 200 fixture tokens render and become interactive within the SC-004 budget in happy-dom (assert a render-time ceiling and that a tick re-renders only time text, not whole lines)

### Implementation for User Story 2

- [ ] T057 [P] [US2] Implement src/ui/components/index-line.tsx (memoized; subscribes to `useNow` only in its time element) (turns T054 green)
- [ ] T058 [US2] Implement src/ui/views/list-view.tsx and src/ui/components/empty-state.tsx; make the list the default view in src/ui/app-shell.tsx (turns T055, T056 green)
- [ ] T059 [US2] Write E2E journey e2e/list-overview.spec.ts (US2 AS1–AS5, SC-007 with a 30s-expiry fixture) and run it

**Checkpoint**: US1 and US2 work independently and together.

---

## Phase 5: User Story 3 - Protect sensitive values and copy what I need (Priority: P3)

**Goal**: masked-by-default sensitive values with per-field reveal, and exact copy actions.

**Independent Test**: open a `withPersonalClaims` token; masked fields, reveal/hide, reset on
reopen, and clipboard contents (quickstart "mask-reveal-copy").

### Tests for User Story 3 ⚠️

- [ ] T060 [P] [US3] Write failing tests src/domain/claims/sensitivity.test.ts for `isSensitiveClaim(path)`: true for last segment in "`email`, `name`, `given_name`, `family_name`, `middle_name`, `nickname`, `phone_number`, `address`, `birthdate`", and for any segment containing "`password`, `secret`, `token` or `key` (case-insensitive)" at any nesting level; false for `sub`, `iss`, `exp`, `roles` (FR-015)
- [ ] T061 [P] [US3] Write failing component tests src/ui/components/masked-value.test.tsx: renders `[masked]` with `[ reveal ]`; reveal shows only that value and toggles to `[ hide ]`; state is announced; unmounting and remounting resets to masked (US3 AS2, AS4)
- [ ] T062 [P] [US3] Write failing component tests src/ui/components/copy-command.test.tsx: writes the exact unmasked text through the Clipboard port, shows `[ copied ]` for 1.2s with a polite live-region announcement, shows an error message when the port returns `{ ok: false }`
- [ ] T063 [P] [US3] Write failing test src/infrastructure/clipboard/navigator-clipboard.test.ts: delegates to `navigator.clipboard.writeText`, maps rejection to `{ ok: false }`

### Implementation for User Story 3

- [ ] T064 [P] [US3] Implement src/domain/claims/sensitivity.ts (turns T060 green)
- [ ] T065 [P] [US3] Implement src/ui/components/masked-value.tsx (turns T061 green)
- [ ] T066 [P] [US3] Implement src/ui/components/copy-command.tsx (turns T062 green)
- [ ] T067 [P] [US3] Implement src/infrastructure/clipboard/navigator-clipboard.ts and wire it in src/entrypoints/sidepanel/main.tsx (turns T063 green)
- [ ] T068 [US3] Extend src/ui/views/detail-view.test.tsx first (signature always masked, sensitive claims masked, copy whole token / header JSON / payload JSON / each claim, reveal resets on reopen), then apply MaskedValue and CopyCommand in src/ui/views/detail-view.tsx and src/ui/components/claim-entry.tsx
- [ ] T069 [US3] Write E2E journey e2e/mask-reveal-copy.spec.ts (clipboard read through Playwright permissions) and run it

---

## Phase 6: User Story 4 - Keep my vault tidy and private (Priority: P4)

**Goal**: rename, delete with undo, clear all, clear expired, persistence and isolation.

**Independent Test**: quickstart "manage-vault" and "persistence-and-isolation".

### Tests for User Story 4 ⚠️

- [ ] T070 [P] [US4] Write failing tests src/domain/vault/label.test.ts for `validateLabel(input)`: trims; "1–60 characters after trimming" (FR-017) → `invalidLabel { reason: 'empty' | 'tooLong' }`
- [ ] T071 [US4] Write failing tests src/application/vault/manage-vault.test.ts: `renameToken` (`renamed`, `invalidLabel`, `notFound`, `saveFailed`); `deleteToken` returns `deleted { record, index }`; `restoreToken(record, index)` reinserts at the original index or reports `duplicate`; `clearAll` → `cleared { count }`; `clearExpired(now)` removes only expired tokens (FR-023) and never touches others; tokens are never removed automatically
- [ ] T072 [P] [US4] Write failing component tests src/ui/components/inline-label-editor.test.tsx: `[ rename ]` enters edit mode with the current label selected; Enter saves, Esc cancels; invalid labels show the reason and keep the previous label (US4 AS1)
- [ ] T073 [P] [US4] Write failing component tests src/ui/components/undo-toast.test.tsx (fake timers): shows for 5 seconds with `[ undo ]`, calls restore once, dismisses itself, is announced politely (US4 AS2, FR-018)
- [ ] T074 [P] [US4] Write failing component tests src/ui/components/confirm-dialog.test.tsx: native `<dialog>` with focus trapped on open, returns focus on close, states the exact count ("Remove 3 tokens?"), confirm and cancel paths (FR-019, FR-023)

### Implementation for User Story 4

- [ ] T075 [P] [US4] Implement src/domain/vault/label.ts (turns T070 green)
- [ ] T076 [US4] Implement src/application/vault/rename-token.ts, delete-token.ts, restore-token.ts, clear-all.ts and clear-expired.ts in that folder (turns T071 green)
- [ ] T077 [P] [US4] Implement src/ui/components/inline-label-editor.tsx (turns T072 green)
- [ ] T078 [P] [US4] Implement src/ui/components/undo-toast.tsx (turns T073 green)
- [ ] T079 [P] [US4] Implement src/ui/components/confirm-dialog.tsx (turns T074 green)
- [ ] T080 [US4] Extend view tests first, then wire rename and `[ delete ]` into src/ui/views/detail-view.tsx, and `[ clear expired ]` (only when any expired) / `[ clear all ]` into the toolbar of src/ui/views/list-view.tsx
- [ ] T081 [US4] Write E2E journeys e2e/manage-vault.spec.ts (rename, undo within 5s, clear expired, clear all) and e2e/persistence-and-isolation.spec.ts (reload and browser-context restart keep tokens, labels, order; a second panel page sees changes; a web page cannot read the vault; nothing in `storage.sync`) and run them

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T082 [P] Write test src/locales/locales.test.ts: `en.yml` and `es.yml` have identical key sets, no empty values, no em-dash or en-dash characters in any string; fix any gap
- [ ] T083 [P] Write E2E e2e/accessibility.spec.ts with `@axe-core/playwright`: list (empty and seeded), add (with error), detail (valid, expired, JWE), confirm dialog, undo toast; in light and dark (`colorScheme`) and en/es (`locale`); zero WCAG 2.2 AA violations (SC-006); plus a keyboard-only pass of US1–US4 at 320px width
- [ ] T084 Run `pnpm test:coverage` (thresholds in vitest.config.ts); add missing tests until `src/domain/**` ≥ 90% and project ≥ 80% on every metric
- [ ] T085 Design gate (plan "Design workflow"): run `impeccable detect --json` on src/ui/ and src/assets/styles/tailwind.css and fix mechanical findings; run `impeccable audit` and `impeccable critique` on the built side panel (two independent assessments; ask the user before spawning sub-agents), apply one fix batch, confirm once
- [ ] T086 Regenerate DESIGN.md from the built UI with `impeccable document` (discharges the direction contract FINISH line); remove the "pre-build direction" banner; keep tokens in src/assets/styles/tailwind.css identical to DESIGN.md
- [ ] T087 [P] Update README.md (status of 001 to Done, usage section with real behavior), docs/roadmap.md (001 Done) and CLAUDE.md if commands changed
- [ ] T088 Run the manual pass in specs/001-token-vault-inspection/quickstart.md in Chromium and Firefox; record results and fix defects through regression tests first

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001–T008)** → **Foundational (T009–T037)** → user stories.
- **US1 (T038–T053)**: after Foundational. The MVP.
- **US2 (T054–T059)**: after Foundational; independent of US1 (tests seed the repository).
  T058 makes the list the default view, so it merges after T052 in practice.
- **US3 (T060–T069)**: needs the detail view from US1 (T051).
- **US4 (T070–T081)**: needs the detail view (T051) and list view (T058).
- **Polish (T082–T088)**: after all targeted stories.

### Within each story

Tests first (observed failing) → domain → application → components → views → E2E.

### Parallel opportunities

- Setup: T003–T008 in parallel after T001–T002.
- Foundational: T009/T010, T015/T016/T017, T019, T021/T022, T027, T030 in parallel.
- US1: T038, T039, T041–T044 in parallel; then T045, T046, T049, T050 in parallel.
- US3: T060–T063 in parallel; then T064–T067 in parallel.
- US4: T070, T072–T074 in parallel; then T075, T077–T079 in parallel.

### Parallel example: User Story 1

```text
Red:   T038 default-label.test · T039 claim-catalog.test · T043 time-ruler.test · T044 claim-entry.test
Green: T045 default-label · T046 claim-catalog · T049 time-ruler · T050 claim-entry + json-view
Then:  T040 → T047 (add-token use case), T041 → T048 (add view), T042 → T051 (detail view), T052, T053
```

## Implementation Strategy

### MVP first

1. Setup + Foundational.
2. US1 → validate with `pnpm check`, `pnpm test:e2e` (add-and-inspect) → demoable MVP.

### Incremental delivery

US2 (index) → US3 (masking and copy) → US4 (management and persistence journeys) → Polish.
Each story ends green on `pnpm check` and its E2E journey before the next starts.

### Traceability

| Requirement           | Tasks                                 |
| --------------------- | ------------------------------------- |
| FR-001–FR-006         | T009–T014, T040–T041, T047–T048, T053 |
| FR-007–FR-012         | T028–T029, T038, T045, T054–T059      |
| FR-013–FR-014         | T039, T042–T044, T046, T049–T051      |
| FR-015–FR-016         | T060–T069                             |
| FR-017–FR-019, FR-023 | T070–T081                             |
| FR-020–FR-022         | T023–T026, T034–T035, T081            |
| FR-024–FR-026         | T030–T031, T036, T082–T083            |
| SC-001–SC-007         | T053, T056, T059, T081, T083          |
