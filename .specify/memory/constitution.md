<!--
Sync Impact Report
- Version change: (template) → 1.0.0
- Modified principles: template placeholders → I. Test-First; II. Spec-Driven Development;
  III. Security & Privacy by Design; IV. Type Safety; V. Simplicity & Separation of Concerns;
  VI. User Experience, Accessibility & i18n
- Added sections: Technology & Supply-Chain Constraints; Development Workflow & Quality Gates
- Removed sections: none
- Templates: plan-template.md "Constitution Check" gate is filled per plan from this file
  (no template edits required); tasks-template.md already orders tests before implementation.
- Deferred TODOs: none
-->

# JWT Inspector Constitution

JWT Inspector is a public, open-source (MIT) browser extension for Chromium browsers and Firefox
(Manifest V3, side panel) that detects, inspects, verifies and crafts JSON Web Tokens. It handles
credentials, so correctness, security and privacy outrank feature velocity.

## Core Principles

### I. Test-First (NON-NEGOTIABLE)

- Every behavior change follows **Red → Green → Refactor**. A failing test MUST exist and be
  observed failing for the right reason before production code is written.
- `tasks.md` MUST list each test task before the implementation task it drives.
- Bug fixes MUST start with a regression test that reproduces the bug.
- Coverage gates: `src/domain/**` ≥ 90% lines, branches, functions and statements; whole
  project ≥ 80%. Enforced on pre-push and in CI.
- Test pyramid:
  - **Unit** (Vitest): pure domain logic — parsing, claims, scoring, key and algorithm rules.
  - **Component** (Testing Library): query by role, label or visible text; never by
    implementation details (class names, component internals).
  - **E2E** (Playwright): the real built extension for every critical user journey.
- Snapshot-only tests MUST NOT be the sole assertion of a behavior.

**Rationale**: a token inspector that mis-parses or mis-scores a token gives users false
confidence about credentials. Tests written first define the behavior before code can bias it.

### II. Spec-Driven Development (NON-NEGOTIABLE)

- Every feature flows `spec.md → clarify (when ambiguous) → plan.md → tasks.md → implement` on
  its own numbered feature branch.
- Specs state WHAT and WHY — user value, acceptance scenarios, measurable success criteria — and
  contain no implementation detail. Plans hold the HOW.
- Every piece of code MUST trace to a requirement, and a requirement without a passing test is
  not done.
- The product roadmap lives in `docs/roadmap.md`. Deferred scope is recorded there, not dropped.
  JWE support is explicitly deferred; the domain model MUST NOT preclude adding it (token
  representation distinguishes JWS from JWE).

**Rationale**: specs keep a growing feature set coherent and reviewable, and make scope
decisions explicit instead of accidental.

### III. Security & Privacy by Design (NON-NEGOTIABLE)

- **No data leaves the browser**: zero telemetry, analytics or remote logging. The only network
  requests the extension makes are JWKS fetches the user explicitly triggers.
- **Least privilege**: install-time permissions are limited to `storage`, `activeTab` and (on
  Chromium) `sidePanel`. Host access is requested at runtime, per site, through
  `optional_host_permissions`. Pages are scanned only while the side panel is open. Deeper
  capture (request/response bodies, console logs) is opt-in per tab.
- **Isolated persistence**: saved tokens live only in extension-private storage
  (`storage.local`); never in page-accessible storage and never in `storage.sync`. Optional
  passphrase encryption uses WebCrypto AES-GCM with a PBKDF2-HMAC-SHA256 key (≥ 600,000
  iterations, per OWASP) and auto-locks. Secrets and private keys MUST NOT be persisted unless
  the user explicitly saves them and encryption is enabled.
- **Read-only toward pages**: the extension MUST NOT inject tokens or values into pages. Content
  scripts only read and forward data through typed messages; every cross-context message is
  validated (sender check + schema parse) before use.
- **Masked by default**: sensitive values (signature, secrets, keys, sensitive claims) render
  masked; reveal is an explicit, per-field, reversible action.
- **No dynamic code**: no `eval`, `new Function`, `dangerouslySetInnerHTML` or remote code; the
  extension ships a strict Content Security Policy.
- **Grounded scoring**: every rule of the 1–10 security score cites its source (RFC 8725 JWT
  Best Current Practices, RFC 7518/7519, OWASP JWT guidance) and is unit-tested.

**Rationale**: users paste and store live credentials. Any leak, over-broad permission or page
interaction turns a debugging tool into an attack vector.

### IV. Type Safety (NON-NEGOTIABLE)

- TypeScript 7 with the strictest configuration (`strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noPropertyAccessFromIndexSignature`, and the rest defined in
  `tsconfig.json`). Weakening a flag requires a constitution amendment.
- Production code MUST NOT use `any`, non-null assertions (`!`) or unchecked casts.
- **Parse, don't validate**: external data — tokens, storage contents, runtime messages, JWKS,
  user input — is parsed at the boundary into typed domain values; unparsed data never crosses
  into the domain.
- Expected failures (malformed token, wrong key, locked vault) are typed results; exceptions are
  reserved for programmer errors.
- oxlint with type-aware rules runs with `--deny-warnings` and is a merge gate.

**Rationale**: JWTs are untrusted input by definition. Types enforce at compile time that no
code path forgets to handle a malformed or hostile token.

### V. Simplicity & Separation of Concerns

- Layers, with dependencies pointing inward only:
  - `src/domain` — pure TypeScript: JWT model, parsing, claims, time, scoring, algorithms and
    keys. No browser APIs, no React.
  - `src/application` — use cases orchestrating the domain through ports (interfaces).
  - `src/infrastructure` — adapters implementing ports: storage, crypto, detectors, messaging.
  - `src/ui` — React components, hooks and view models.
  - `src/entrypoints` — WXT wiring only; no business logic.
- Token sources (cookie, localStorage, sessionStorage, request header, URL parameter, body,
  console log, manual entry, created) are detectors behind **one** interface. Adding a source
  MUST NOT modify existing detectors or their consumers.
- KISS and YAGNI: no speculative abstractions. Extract on the third repetition, or earlier only
  when a principle requires a seam (e.g. a port for testability).
- Small, single-responsibility modules; no circular imports (lint-enforced).

**Rationale**: the feature set grows along known axes (new sources, new algorithms, JWE). Clean
boundaries let each axis grow without rewriting the others.

### VI. User Experience, Accessibility & i18n

- The interface MUST be distinctive and purposeful, not templated. Visual decisions live in
  `DESIGN.md` and are expressed as Tailwind v4 `@theme` tokens; arbitrary one-off values
  (`bg-[#…]`, `p-[13px]`) are not allowed.
- WCAG 2.2 AA: fully keyboard operable, visible focus, correct roles and labels, sufficient
  contrast, `prefers-reduced-motion` respected, light and dark themes.
- Every user-facing string goes through i18n (English default, Spanish). No hardcoded copy.
- Fixed-choice inputs (algorithm, key type, source filters) are selects or radio groups listing
  every valid option.
- The side panel stays fully usable at 320px width.
- The detail view prioritizes what users act on: validity and time to expiry first, then
  claims, then raw parts.

**Rationale**: a daily-use developer tool succeeds by being faster and clearer than pasting a
token into a website, for every user.

## Technology & Supply-Chain Constraints

- **Stack**: WXT (MV3 for Chromium and Firefox), React 19, Tailwind CSS 4, TypeScript 7, Vitest
  + Testing Library, Playwright, oxlint (type-aware via tsgolint) and oxfmt. Changing a
  cornerstone tool requires a plan-level justification.
- **JWT/crypto**: WebCrypto for all cryptographic operations; any JWT library MUST be
  audited, dependency-light and run without remote calls.
- **Package manager**: pnpm `12.6.0` exactly (`packageManager`, `engines`, `engineStrict`).
- **Exact pins**: every dependency is pinned to an exact version (`saveExact`).
- **Supply-chain policy** (`pnpm-workspace.yaml`): `minimumReleaseAge` 24h,
  `trustPolicy: no-downgrade`, `blockExoticSubdeps`, `strictDepBuilds` with an explicit,
  reviewed `allowBuilds` list. Every `overrides` entry MUST cite the advisory or reason.
- **Vulnerabilities**: `audit-ci` blocks commits and CI on any known vulnerability of any
  severity. Allowlist entries MUST name the advisory and why it is not exploitable here.
- **CI supply chain**: GitHub Actions pinned by full commit SHA; Dependabot with cooldown.

## Development Workflow & Quality Gates

- **Branches**: one numbered feature branch per spec (`NNN-short-name`); `main` is always
  releasable.
- **Commits**: Conventional Commits, enforced by commitlint (allowed scopes in
  `commitlint.config.ts`).
- **Pre-commit**: lint-staged (oxfmt + oxlint --fix on staged files), typecheck, unit and
  component tests, `audit-ci`.
- **Pre-push**: tests with coverage thresholds.
- **CI**: all of the above, plus production builds for Chromium and Firefox, Playwright E2E and
  CodeQL.
- **Releases**: release-please produces `CHANGELOG.md` and the version bump from commits; the
  extension manifest version equals `package.json` version. Store packages are built from the
  release tag.
- **Definition of done**: acceptance scenarios pass as tests, coverage gates hold, the
  Constitution Check holds, user docs (in-extension help and README) reflect the change.

## Governance

- This constitution supersedes all other practices, including agent instructions.
- Every `plan.md` MUST contain a Constitution Check gate evaluated before research and again
  after design. A violation is allowed only with an explicit justification in the plan's
  Complexity Tracking section.
- Amendments are made through a pull request stating the rationale and impact, and bump the
  version using semantic versioning:
  - **MAJOR**: a principle is removed or redefined incompatibly.
  - **MINOR**: a principle or section is added or materially expanded.
  - **PATCH**: clarifications and wording.
- Reviews (human or agent) MUST verify compliance; runtime development guidance lives in
  `CLAUDE.md` and MUST NOT contradict this document.

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
