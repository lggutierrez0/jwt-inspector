# JWT Inspector

Browser side panel to **detect, inspect, verify and craft JSON Web Tokens** — for Chromium browsers
(Chrome, Edge, Brave, Opera) and Firefox.

> Status: pre-release. Built with Spec-Driven Development — see [`docs/roadmap.md`](docs/roadmap.md)
> and [`specs/`](specs/) for what is planned and in progress.

## Privacy by design

- Tokens never leave your browser: no telemetry, no remote calls except the JWKS URLs you choose to fetch.
- Pages scan only while the panel is open, and only on sites you grant access to.
- Stored tokens live in extension-only storage, optionally encrypted with your passphrase.

## Development

Requirements: Node `24.19.0` (see `.nvmrc`) and pnpm `12.6.0` (pinned via `packageManager`, `corepack enable`).

```sh
pnpm install          # also installs git hooks
pnpm dev              # Chromium with hot reload
pnpm dev:firefox      # Firefox
pnpm check            # format + lint + typecheck + unit tests
pnpm test:e2e         # build + Playwright against the real extension
```

| Area        | Tooling                                                         |
| ----------- | --------------------------------------------------------------- |
| Extension   | [WXT](https://wxt.dev) (MV3), React 19, Tailwind CSS 4          |
| Types       | TypeScript 7 (strictest flags)                                  |
| Lint/format | oxlint with type-aware rules (tsgolint), oxfmt                  |
| Tests       | Vitest + Testing Library, Playwright (E2E)                      |
| Commits     | Conventional Commits (commitlint), lint-staged, husky, audit-ci |
| Releases    | release-please → CHANGELOG.md, version bump, store-ready zips   |

## Contributing

Every change follows **spec → plan → tasks → test-first implementation**. Read
[`.specify/memory/constitution.md`](.specify/memory/constitution.md) before opening a PR.

## License

[MIT](LICENSE)
