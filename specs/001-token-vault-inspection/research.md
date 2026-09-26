# Research: Token Vault & Inspection

Decisions for feature 001. Every decision was checked against the installed packages (not only
documentation) on 2026-09-26.

## R1. JWT decoding: own domain parser, zero dependencies

- **Decision**: implement decoding in `src/domain/jwt` as pure functions: split on `.`,
  strict base64url decode (alphabet check, no padding required, reject `=` in the middle),
  UTF-8 decode with a fatal decoder, `JSON.parse`, then require a JSON object for header and
  payload. Five parts with `enc` in the header → JWE (recognized, unsupported).
- **Rationale**: decoding is ~100 lines, security-sensitive and must report _specific_ errors
  (FR-003), which libraries do not expose. A zero-dependency pure module is trivially 100%
  unit-testable (Principle I) and keeps the domain free of third-party code (Principle V).
- **Alternatives**: `jose` `decodeJwt`/`decodeProtectedHeader` — generic errors, adds
  verification code we do not need yet (it will enter in 003/004 for verification and signing);
  `jwt-decode` — no header-vs-payload error distinction, no JWE awareness.
- **Note**: `JSON.parse` keeps the last value for duplicate member names. RFC 7515 §5.2 requires
  rejecting or using a strict parser for duplicates; 001 only displays, and the duplicate-name
  check is recorded as a finding for the security score (002).

## R2. Boundary parsing (storage records, later runtime messages): valibot

- **Decision**: `valibot@1.5.0` (no dependencies, modular, tree-shaken to ~1–2 KB for our
  schemas) for data read from storage now and for runtime messages in 005–007.
- **Rationale**: Principle IV requires parsing untyped external data into domain types.
  Storage migrations in WXT receive `any`; a schema turns that into a typed `VaultState` or a
  typed error. valibot's output types are inferred, so types and runtime checks cannot drift.
- **Alternatives**: `zod@4.6.5` (also zero-dependency; larger bundle for the same schemas);
  hand-written guards (duplicate the types by hand and drift over time).

## R3. Persistence: one versioned item in extension-local storage

- **Decision**: a single WXT storage item `local:vault` (`@wxt-dev/storage`, bundled with WXT
  0.21.4) with `version: 1`, `fallback: { tokens: [] }` and a migrations map; reads parse through
  the valibot schema. Cross-panel sync (FR-022) uses the item's `watch()` callback, which fires on
  `storage.onChanged` from any extension page.
- **Rationale**: `storage.local` is private to the extension (not readable by pages or other
  extensions) and never synced (FR-020). One item makes every change a single atomic write
  (ordering, clear-all, undo restore) and keeps 008 (encryption) a one-record transformation
  (FR-021). Expected size: typical token ≈ 1 KB → 200 tokens ≈ 200 KB, far below the 10 MB
  `storage.local` quota, so `unlimitedStorage` is not requested (least privilege).
- **Alternatives**: one key per token (non-atomic ordering and clear-all, more listeners);
  IndexedDB (heavier API, no benefit at this size).

## R4. Architecture seams (ports)

- **Decision**: application use cases depend on four ports: `VaultRepository` (load, save,
  subscribe), `Clock` (now), `Clipboard` (writeText), `IdGenerator` (new id). Infrastructure
  provides browser adapters; tests provide in-memory fakes.
- **Rationale**: the minimum seams needed for deterministic tests (Principle I) and for 005–008
  to plug in (new token producers, encrypted repository) without touching the domain.
- **Alternatives**: calling browser APIs from components (untestable without a browser, mixes
  layers).

## R5. Live time: one shared ticker

- **Decision**: a single `ClockTicker` in the UI layer publishes `now` every second while the
  document is visible (paused on `visibilitychange`), consumed with `useSyncExternalStore`.
  All status/time math is pure domain code taking `now` as an argument.
- **Rationale**: FR-010 and SC-007 (≤ 1 s lag at expiry) are met with a 1 s tick; one timer for
  the whole panel instead of one per row keeps 200 rows cheap (SC-004). Pure time functions are
  tested with fixed instants; the ticker with Vitest fake timers.
- **Alternatives**: per-row timers (N timers, drift between rows, violates SC-007 agreement);
  adaptive scheduling to the next boundary (more complex; unnecessary at 1 s granularity).

## R6. Time formatting: platform Intl only

- **Decision**: `Intl.RelativeTimeFormat` for relative times, `Intl.DateTimeFormat` with
  `timeZoneName: 'short'` for absolute times, and a small domain formatter for durations
  ("2 h 14 min"). Locale comes from the i18n layer.
- **Rationale**: zero dependencies, correct in English and Spanish. Tests pin `TZ=UTC`.
- **Alternatives**: date-fns / dayjs (bundle weight for features Intl already covers).

## R7. i18n: `@wxt-dev/i18n` behind an injected translator

- **Decision**: messages live in `src/locales/{en,es}.yml`; keys are typed by WXT's generated
  structure (unknown keys fail to compile). Components get `t` from a React context fed by
  `createI18n()` in production. Tests inject a translator built from the same YAML files,
  because the WXT fake browser does not implement `i18n.getMessage` (verified in
  `@webext-core/fake-browser`).
- **Rationale**: one source of truth for copy; plural forms supported (`plural: true`) for
  counts ("3 tokens"); language follows the browser (FR-025).
- **Alternatives**: i18next / react-intl (runtime weight, duplicated locale plumbing).

## R8. Clipboard

- **Decision**: `navigator.clipboard.writeText` behind the `Clipboard` port, called only from
  user gestures (copy buttons). No `clipboardWrite` permission needed for gesture-initiated
  writes from an extension page.
- **Rationale**: least privilege; works in Chromium side panel and Firefox sidebar.

## R9. Rendering JSON and tokens safely

- **Decision**: a React JSON view that renders parsed values as elements (keys, strings,
  numbers, booleans, null) with syntax colors from theme tokens; the token strip renders the
  three encoded segments as text nodes. No `dangerouslySetInnerHTML` anywhere (Principle III-f).
- **Alternatives**: highlight libraries (produce HTML strings → innerHTML).

## R10. Navigation and state

- **Decision**: no router. A small reducer holds the view (`list | detail(id) | add`),
  selection, highlight and pending undo. Vault data comes from the repository subscription.
- **Rationale**: KISS (Principle V); three views do not justify a routing dependency.

## R11. Icons and fonts (bundled, no remote requests)

- **Decision**: no icon library. The chosen direction (R14) expresses actions as bracketed text
  commands, so icons would add weight without meaning. Font: `@fontsource-variable/martian-mono@5.3.0`
  (`standard` file: `wght` 100–800 and `wdth` axes in one woff2, ~38 KB latin + latin-ext).
- **Rationale**: Principle III-a forbids remote calls (no Google Fonts CDN). One variable file
  covers every weight and both widths the design uses.
- **Alternatives**: Iosevka (≈1 MB per weight even in the latin subset: over budget);
  Monaspace Neon/Xenon (~45 KB per static weight); JetBrains Mono and IBM Plex (category
  defaults flagged by impeccable); `lucide-react` / `@phosphor-icons/react` (not needed once
  commands are text; taste-skill also discourages Lucide).

## R12. Accessibility testing

- **Decision**: `@axe-core/playwright@4.13.0` in E2E for list, detail, dialogs, both themes and
  both locales (SC-006); Testing Library role/label queries in component tests.

## R13. Content Security Policy

- **Decision**: declare `content_security_policy.extension_pages` explicitly as
  `script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'` (MV3 disallows
  weakening `script-src`; explicit declaration documents and tightens the default).

## R14. Visual direction (impeccable new-work + taste skill)

- **Decision**: "RFC / Internet-Draft". The panel is set like the specification it inspects:
  RFC-style front matter (issuer, subject, audience | status, time left), numbered sections that
  mirror the token's structure, every claim with its real citation (e.g. RFC 7519 §4.1.4), an
  index with dotted leaders for the list, a ten-division time ruler, 1px rules, bracketed text
  commands, Martian Mono only. Chosen by the user on 2026-09-26 among the dealt direction, the
  designer's pick (passport/MRZ) and the category standard. Full spec in `/DESIGN.md`; direction
  contract in `.impeccable/surfaces/` (seed `12a1d735`).
- **Process**: impeccable `init` (PRODUCT.md from a user interview) → `new-work` (seven
  audience-world candidates, `concept-seed` roll, six catalog challengers fused and judged on
  audience identification and product clarity; raises kept: graticule, 1px rules and printed-mark
  states, hierarchy by scale and weight, literal zone names) → user choice. taste-skill applied
  within its stated scope (it excludes dense product UI): design read, dials 4/3/7, anti-default
  checks (no em-dashes in UI copy, no decorative dots, no filled-track bars, full state cycles).
- **Rejected**: the ui-ux-pro-max design-system output (slate + neon green, landing pattern:
  matches the "near-black + one neon accent" cluster); the first draft of this plan (IBM Plex +
  JetBrains Mono, generic rows): competent but guessable from the category.
- **Consequence for tasks**: after the UI is built, run impeccable `detect`, `audit` and
  `critique` (two independent assessments), fix in one batch, then regenerate DESIGN.md from
  the built UI (`impeccable document`) — required by the direction contract's FINISH line.

## R15. Lint profile adjustments during implementation

- **Decision**: the `react-perf` oxlint plugin is not enabled.
- **Rationale**: its `jsx-no-new-*` rules flag every inline handler or object prop, forcing
  `useCallback`/`useMemo` everywhere without a measured benefit (Principle V, KISS). Rendering
  cost is guarded where it matters instead: the list re-render test and the SC-004 E2E budget.
- **Also**: `max-lines-per-function` and `max-classes-per-file` are off only in test files and
  shared test doubles, where long `describe` blocks and grouped fakes are the norm.
- **Also**: `import/max-dependencies` is raised from 10 to 16: views legitimately compose many
  small components; `max-lines-per-function` (50) stays as the signal to split components.
- **Also**: `max-lines-per-function` is 50 for `.ts` (logic) and 80 for `.tsx` components, where
  the formatter spreads JSX props one per line; blank lines and comments do not count.
