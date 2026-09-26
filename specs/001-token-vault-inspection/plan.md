# Implementation Plan: Token Vault & Inspection

**Branch**: `001-token-vault-inspection` | **Date**: 2026-09-26 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-token-vault-inspection/spec.md`

## Summary

Deliver the core of JWT Inspector: paste a token, decode it with specific errors, keep it in a
private persistent vault, and inspect it in a detail view built for the first glance (status and
time ruler first, then claims with explanations, masked sensitive values, copy actions).
Technically: a zero-dependency JWT decoder and pure time/label/sensitivity functions in the
domain; use cases over four ports (vault repository, clock, clipboard, id generator); a WXT
`storage.local` adapter with a versioned, valibot-parsed record; a React UI following DESIGN.md
with one shared 1 s ticker for live countdowns. See [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 7.0.2 (strictest flags), ES2024 target, React 19.3 JSX

**Primary Dependencies**: WXT 0.21.4 (+ `@wxt-dev/storage`, `@wxt-dev/i18n`), React 19.3,
Tailwind CSS 4.3. New for this feature (exact pins): `valibot@1.5.0`, `lucide-react@1.48.0`,
`@fontsource-variable/ibm-plex-sans@5.3.0`, `@fontsource-variable/jetbrains-mono@5.3.0`;
dev: `@axe-core/playwright@4.13.0`

**Storage**: `storage.local` single item `local:vault`, schema v1
([contract](contracts/storage-vault-v1.md))

**Testing**: Vitest 5.0.1 + Testing Library (happy-dom, fake timers, `TZ=UTC`), WXT fake browser
for storage, Playwright 1.63 with the built extension + axe

**Target Platform**: Chromium ≥ 116 (sidePanel API), Firefox ≥ 128 (MV3 sidebar_action)

**Project Type**: Browser extension (single project, layered `src/`)

**Performance Goals**: panel interactive < 1 s with 200 tokens (SC-004); countdown lag ≤ 1 s
(SC-007); add-to-detail ≤ 3 interactions (SC-001)

**Constraints**: no network access; no new permissions; bundle growth ≤ 150 KB gzipped for this
feature (fonts dominate); works at 320px; WCAG 2.2 AA in both themes and locales

**Scale/Scope**: 1 user per profile, up to hundreds of tokens (≈ 1 KB each, max 64 KiB),
3 views (list, add, detail), ~19 components

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle               | Gate                                                                                                         | Pre-research | Post-design                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ------------ | -------------------------------------------------------------------------------- |
| I. Test-First           | Every FR has a test at the lowest viable level; tasks will order tests before code; coverage gates unchanged | ✅           | ✅ Journeys ↔ FRs mapped in quickstart; fixtures defined                         |
| II. Spec-Driven         | Spec complete, clarifications resolved, roadmap updated                                                      | ✅           | ✅ No scope added beyond spec                                                    |
| III. Security & Privacy | No network, no new permissions, storage.local only, no secrets stored, masking by default, no innerHTML, CSP | ✅           | ✅ R3, R8, R9, R11, R13; contract forbids secrets                                |
| IV. Type Safety         | External data parsed at boundaries; typed results for expected failures                                      | ✅           | ✅ valibot on storage reads (R2); DecodeResult/use-case results are unions       |
| V. Simplicity & SoC     | Layers respected; one source model for all origins; no speculative abstractions                              | ✅           | ✅ 4 ports only; no router/state library (R10); TokenSource union covers 005–007 |
| VI. UX, a11y, i18n      | DESIGN.md + tokens; AA verified; en/es; 320px                                                                | ✅           | ✅ Contrast computed for every text token; axe in E2E (R12)                      |
| Tech & supply chain     | Exact pins, audited, zero-dependency additions                                                               | ✅           | ✅ All 4 runtime additions have no dependencies                                  |
| Workflow & gates        | Conventional commits, hooks, CI unchanged                                                                    | ✅           | ✅                                                                               |

No violations → Complexity Tracking not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-token-vault-inspection/
├── plan.md              # This file
├── research.md          # Phase 0: decisions R1–R14
├── data-model.md        # Phase 1: stored + derived model, UI state transitions
├── quickstart.md        # Phase 1: validation guide
├── contracts/
│   ├── storage-vault-v1.md
│   └── ports.md
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── domain/                      # pure TS, no browser APIs, no React
│   ├── jwt/                     # normalize, base64url, decode (DecodeResult, DecodeError)
│   ├── time/                    # time claims, status, lifetime, duration formatting parts
│   ├── claims/                  # claim catalog (explanations keys), sensitivity, default label
│   └── vault/                   # TokenRecord, TokenSource, VaultState, label rules, ordering
├── application/
│   ├── ports/                   # VaultRepository, Clock, Clipboard, IdGenerator
│   └── vault/                   # use cases: add, rename, delete, restore, clearAll, clearExpired
├── infrastructure/
│   ├── storage/                 # BrowserVaultRepository (WXT item + valibot schema + migrations)
│   ├── clipboard/               # NavigatorClipboard
│   └── system/                  # SystemClock, CryptoIdGenerator
├── ui/
│   ├── app/                     # AppShell, view reducer, providers (i18n, clock, services)
│   ├── i18n/                    # translator context, formatters (Intl) bound to locale
│   ├── clock/                   # shared ClockTicker + useNow
│   ├── components/              # DESIGN.md inventory (TokenRow, TimeRuler, MaskedValue, ...)
│   └── views/                   # ListView, AddTokenView, DetailView
├── entrypoints/                 # background.ts, sidepanel/ (wiring only)
├── assets/styles/tailwind.css   # @theme tokens mirrored from DESIGN.md
└── locales/{en,es}.yml

tests/
├── setup.ts
├── fixtures/tokens.ts           # generated test tokens + malformed corpus
└── support/                     # in-memory ports, YAML-backed translator, render helpers

e2e/
├── fixtures.ts
└── *.spec.ts                    # journeys listed in quickstart.md
```

**Structure Decision**: single WXT project with the constitution's layers under `src/`. Unit
and component tests are colocated (`*.test.ts[x]` next to the code) so each module's contract
sits beside it; shared test doubles and fixtures live in `tests/`. Import direction is enforced
by `import/no-cycle` and reviewed in the Constitution Check: `ui → application → domain`,
`infrastructure → application/domain`, `entrypoints → all`.

## Complexity Tracking

No constitution violations to justify.
