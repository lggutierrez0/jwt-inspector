# Quickstart: validate Token Vault & Inspection

How to prove feature 001 works. Automated checks come first; the manual pass covers what only a
human can judge (visual quality, feel).

## Prerequisites

- Node 24.19.0, pnpm 12.6.0 (`corepack enable`), Chromium for Playwright
  (`pnpm exec playwright install chromium`), Firefox ≥ 128 for the manual Firefox pass.
- `pnpm install` on branch `001-token-vault-inspection`.

## Automated validation

```sh
pnpm check           # format, type-aware lint, typecheck, unit + component tests
pnpm test:coverage   # domain ≥ 90%, project ≥ 80%
pnpm test:e2e        # builds, loads the extension in Chromium, runs journeys + axe
```

Expected: all green. E2E journeys map to the spec:

| Journey (e2e)                            | Covers                                      |
| ---------------------------------------- | ------------------------------------------- |
| add-and-inspect                          | US1 AS1–AS8, FR-001–FR-006, SC-001, SC-002  |
| list-overview                            | US2, FR-007–FR-012, SC-007                  |
| mask-reveal-copy                         | US3, FR-015, FR-016                         |
| manage-vault (rename, undo, clear)       | US4 AS1–AS3, AS6–AS7, FR-017–FR-019, FR-023 |
| persistence-and-isolation                | US4 AS4–AS5, FR-020, FR-022, SC-005         |
| accessibility (axe, both themes/locales) | FR-026, SC-006                              |
| always-on-bar                            | US5 AS1–AS5, FR-027–FR-029                  |

## Test fixtures

`tests/fixtures/tokens.ts` exports named tokens generated for tests (never real credentials):
valid with 1 h left, expiring in 30 s, expired, not yet valid, no `exp`, no `iat`/`nbf`,
`alg: none` with empty signature, large (16 KB), Unicode claims, invalid time claims, JWE
(5 parts), and a malformed corpus for SC-003 (wrong part counts, bad base64url per part, bad
JSON, JSON arrays).

## Manual pass (Chromium and Firefox)

1. `pnpm dev` (Chromium) or `pnpm dev:firefox`; open the side panel from the toolbar icon.
2. Empty state explains the tool; add the "valid 1 h" fixture with `Bearer ` prefix → detail
   opens, status and ruler visible without scrolling at 320px width (resize the panel).
3. Add the same token again → no duplicate; the existing token opens with an "already saved" notice.
4. Add "expiring in 30 s" → watch the countdown reach "Expired" within 1 s of expiry.
5. Detail: signature and `email` masked; reveal/hide one; copy payload and one claim, paste into
   an editor to confirm exact values; close and reopen → masked again.
6. Rename a label (try empty and 61 chars → rejected); delete a token → Undo within 5 s restores
   it in place; "Clear expired" removes only expired; "Clear all" asks with the count.
7. Open a second browser window with the panel: changes in one appear in the other.
8. Restart the browser → same tokens, labels, order.
9. Switch the OS to dark mode and the browser language to Spanish → everything adapts; keyboard
   only (Tab, Enter, Esc, arrows in the list) completes steps 2–6.
10. From a page's devtools console run `chrome.storage` / `localStorage` lookups → vault is not
    reachable.
11. The command bar under the title is present on the list, add, detail and info screens, with
    "add token" hidden only on add and "info" hidden only on info; "clear expired"/"clear all"
    appear and disappear as tokens are added, expire and are removed.
12. Open `[ info ]` from the list, from the add screen and from a detail; `[ back ]` returns to
    each one, not always the list; the version shown matches the panel header's.
13. Use the language command to switch to Spanish; every string, including the language
    command's own name, is now in Spanish; restart the browser → the choice is remembered. Use
    it again to switch back.

## Done when

All automated checks pass, the manual pass finds no defect, and `DESIGN.md` reflects every
visual decision made while implementing.
