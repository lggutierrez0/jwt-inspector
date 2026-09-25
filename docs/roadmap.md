# Roadmap

Each item becomes one spec under `specs/NNN-name/` and one feature branch. Order follows
dependencies: every step ships something usable and testable on its own. Status is updated when a
feature merges.

| #   | Feature                       | Delivers                                                                                                                                                                                                                               | Depends on | Status   |
| --- | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | -------- |
| 000 | Foundation                    | Tooling, quality gates, side panel shell, constitution                                                                                                                                                                                 | —          | Done     |
| 001 | Token vault & inspection      | Paste a token manually, decode it, list it (label, tail, time left, total lifetime, source), detail view (header, claims, raw parts, masked sensitive values, reveal/copy), rename, delete one, clear all, persistent isolated storage | 000        | Spec'd   |
| 002 | Security score                | 1–10 score in the detail view from public data, each finding explained and cited (RFC 8725, RFC 7518/7519, OWASP)                                                                                                                      | 001        | Planned  |
| 003 | Signature verification        | Verify with a shared secret, a PEM/JWK public key, or a JWKS URL the user provides                                                                                                                                                     | 001        | Planned  |
| 004 | Token builder                 | Create tokens: every JWS algorithm (HS*, RS*, PS*, ES*, EdDSA, `none` with warning), header and claims editor with JSON editing and preview, expiry helpers, secret entry or key generation/import (PEM/JWK)                           | 001, 003   | Planned  |
| 005 | Automatic detection — storage | Scan cookies, localStorage and sessionStorage of the active tab while the panel is open, with per-site permission grants                                                                                                               | 001        | Planned  |
| 006 | Automatic detection — network | Scan request headers and URL parameters of the active tab                                                                                                                                                                              | 005        | Planned  |
| 007 | Deep capture (opt-in)         | Per-tab opt-in capture of request/response bodies and console logs                                                                                                                                                                     | 006        | Planned  |
| 008 | Vault encryption              | Optional passphrase: AES-GCM + PBKDF2, lock/unlock, auto-lock, safe persistence of secrets and keys                                                                                                                                    | 001        | Planned  |
| 009 | Help & about                  | Info view documenting features, privacy model and permissions; version always visible                                                                                                                                                  | 001        | Planned  |
| —   | JWE support                   | Inspect and decrypt encrypted tokens (5 parts), and create them. **Deferred** — the domain model distinguishes JWS/JWE from 001 so this can be added without breaking changes                                                          | 003, 004   | Deferred |

## Cross-cutting from day one

- i18n (English, Spanish), light/dark themes, WCAG 2.2 AA, 320px minimum width.
- Visual identity defined in `DESIGN.md` during 001 and reused by every later feature.
