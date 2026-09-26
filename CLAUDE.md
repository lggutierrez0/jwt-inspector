# JWT Inspector — agent guide

Browser extension (WXT, MV3, Chromium + Firefox side panel) to detect, inspect, verify and craft
JWTs. The rules that govern everything are in `.specify/memory/constitution.md`; this file is
the runtime guide and must never contradict it.

## Workflow (SDD + TDD, non-negotiable)

1. Features follow `/speckit-specify → /speckit-clarify → /speckit-plan → /speckit-tasks →
/speckit-analyze → /speckit-implement`, one numbered branch per feature (`docs/roadmap.md`).
2. Implementation is Red → Green → Refactor: write the test, run it and see it fail for the
   right reason, then write the minimum code, then refactor with tests green.
3. Before UI work read `DESIGN.md`; use only its `@theme` tokens. Record new visual decisions
   there.

## Commands

```sh
pnpm dev | pnpm dev:firefox     # run with hot reload
pnpm test:watch                 # TDD loop
pnpm check                      # format + lint (type-aware) + typecheck + tests
pnpm test:coverage              # domain ≥ 90%, project ≥ 80%
pnpm test:e2e                   # build + Playwright against the real extension
```

## Architecture

`src/domain` (pure) ← `src/application` (use cases + ports) ← `src/infrastructure` (browser
adapters) / `src/ui` (React) ← `src/entrypoints` (wiring). Never import browser APIs or React in
`src/domain`. Parse external data at boundaries (valibot). Expected failures are typed results.

## Conventions

- Conventional Commits with scopes from `commitlint.config.ts`; hooks run lint-staged,
  typecheck, tests and audit-ci — never bypass them (`--no-verify` is not allowed).
- Dependencies: exact versions only (`pnpm add pkg@x.y.z`); new packages need a zero/low
  dependency footprint and a note in the feature's research.md.
- All user-facing text goes through `src/locales/{en,es}.yml`.

<!-- SPECKIT START -->

For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
at specs/001-token-vault-inspection/plan.md
<!-- SPECKIT END -->
