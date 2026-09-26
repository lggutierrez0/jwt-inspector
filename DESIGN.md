# DESIGN.md — JWT Inspector

Living design spec. Read before any UI change; update when a durable visual decision is made.
Tokens below are mirrored 1:1 as Tailwind v4 `@theme` variables in
`src/assets/styles/tailwind.css`. Components use tokens only — no arbitrary values.

> **Status: describes the built UI (feature 001, 2026-09-26).** Direction chosen through
> impeccable's new-work flow (seed `12a1d735`, contract in `.impeccable/surfaces/`), then
> confirmed by a dual-agent critique on the built panel. When code and this file disagree, one of
> them is a bug.

## Direction: the panel is set like the specification it inspects

JWTs are defined in plain-text RFCs (7519, 7515, 8725). The panel adopts that grammar: a token
reads like an Internet-Draft. Front matter answers _who_ and _until when_; numbered sections are
the token's real structure; every claim carries its real citation (`RFC 7519, Section 4.1.4`).
Developers, QA and pentesters already read this format; here it becomes an instrument.

Refused: the category default (colored token string over two JSON panes, rounded cards, pill
badges) and its predictable opposite (black terminal with a neon accent).

Mode: **Operate**. Expression never hides task, state or familiar affordances.

## Color

Chroma is reserved for meaning: three part hues and four time states. Everything else is ink on
paper. Values in OKLCH; every text token passes WCAG 2.2 AA (≥ 4.5:1) on all three surfaces of
its theme (computed 2026-09-26).

| Token            | Light                        | Dark                    | Use                                         |
| ---------------- | ---------------------------- | ----------------------- | ------------------------------------------- |
| `surface`        | `oklch(0.985 0.004 250)`     | `oklch(0.19 0.025 265)` | Page                                        |
| `surface-raised` | `oklch(1 0 0)`               | `oklch(0.23 0.028 265)` | Floating layers, hovered/focused index line |
| `surface-sunken` | `oklch(0.955 0.006 250)`     | `oklch(0.16 0.022 265)` | Inputs, raw parts, figures                  |
| `ink`            | `oklch(0.24 0.03 265)`       | `oklch(0.95 0.008 255)` | Text                                        |
| `ink-muted`      | `oklch(0.48 0.025 262)`      | `oklch(0.74 0.02 258)`  | Citations, leaders, captions                |
| `line`           | `oklch(0.9 0.008 255)`       | `oklch(0.32 0.03 265)`  | 1px rules (decorative)                      |
| `line-strong`    | `oklch(0.62 0.02 258)`       | `oklch(0.54 0.03 262)`  | Input borders, graticule (≥ 3:1)            |
| `part-header`    | `oklch(0.52 0.2 355)`        | `oklch(0.75 0.16 355)`  | Header segment and section                  |
| `part-payload`   | `oklch(0.5 0.2 290)`         | `oklch(0.74 0.15 295)`  | Payload segment and section                 |
| `part-signature` | `oklch(0.5 0.1 205)`         | `oklch(0.8 0.11 200)`   | Signature segment and section               |
| `status-valid`   | `oklch(0.5 0.13 150)`        | `oklch(0.78 0.15 150)`  | Valid                                       |
| `status-soon`    | `oklch(0.52 0.13 65)`        | `oklch(0.83 0.14 80)`   | Expires soon (≤ 10% life or ≤ 5 min)        |
| `status-expired` | `oklch(0.52 0.19 27)`        | `oklch(0.72 0.17 25)`   | Expired, destructive commands               |
| `status-future`  | `oklch(0.5 0.14 245)`        | `oklch(0.77 0.12 245)`  | Not yet valid                               |
| `focus`          | `oklch(0.5 0.12 215)`        | `oklch(0.8 0.11 210)`   | Focus marks, links, caret, selection        |
| `scrim`          | `oklch(0.16 0.02 265 / 55%)` | same as light           | Dialog backdrop                             |

Rules: color never carries meaning alone (status is always also a word); tints are named tokens
built with `color-mix(in oklch, <token> 12%, transparent)`; text selection is `focus` at 28%;
theme follows `prefers-color-scheme`. The scrim stays dark in both themes (a light wash glares in
dark mode).

## Typography: one family, fixed pitch

- **Martian Mono Variable** sets everything. One file carries both axes the design uses:
  - `wdth 75` (condensed) for token data, claim values, times and the index: ~45 columns at
    320px, so encoded segments and long values stay readable in a narrow panel.
  - `wdth 100` (normal) for section heads, front-matter labels, commands and explanatory prose.
- Bundled from Fontsource (`@fontsource-variable/martian-mono`). `src/assets/styles/fonts.css`
  declares only the latin and latin-ext faces (~60 KB); the package's Cyrillic files are not
  shipped. No remote fonts.
- Body typography is an **unlayered** rule at the end of `tailwind.css`, on purpose: Chromium
  injects an unlayered stylesheet into extension pages (`body { font-family: <system sans>;
font-size: 75% }`) and unlayered rules beat every `@layer`. The root font size is never set,
  so `rem` stays 16px and Tailwind spacing (including the 24px `min-h-6` target) holds.
- Rejected: Iosevka (≈1 MB per weight even when subset to latin: over the bundle budget);
  JetBrains Mono and IBM Plex (category defaults).

| Token        | Size / leading | Weight | Use                                           |
| ------------ | -------------- | ------ | --------------------------------------------- |
| `text-cite`  | 12px / 16px    | 400    | Citations, leaders, captions                  |
| `text-body`  | 13px / 20px    | 400    | Values and rows (wdth 75), prose (wdth 100)   |
| `text-label` | 13px / 20px    | 700    | Field names in front matter, claim names      |
| `text-head`  | 14px / 20px    | 700    | Token label (h2), section heads (h3)          |
| `text-state` | 22px / 26px    | 700    | Status word and time left (largest on screen) |

Hierarchy comes from weight and one size jump (13 → 22), never from color or decoration.
Sentence case; section numbers are real document structure, not ornament; no em-dashes in UI copy.
Outline: the panel title is the page's top level, the screen title or token label is the one `h2`
(focused on screen change, WCAG 2.4.3), numbered sections are `h3`.

## Space, rules, shape

- Grid: 1ch columns horizontally (Martian Mono ch), 4px vertical baseline steps (`1`=4 … `6`=24).
  Gutter 12px at 320px, 16px from 400px (`wide` breakpoint, the only one). Everything else wraps
  by content (`flex-wrap`, `basis-*`, `min-w-0`), never by a fixed width, because panel width is
  user-chosen and text length is data-dependent.
- Nothing scrolls sideways at 320px: long values break anywhere (`break-all`) inside `min-w-0`
  boxes; masked values switch to a block layout (command above the value) when they sit in a
  figure or JSON block.
- Structure is drawn with 1px rules only. No cards. Radius 2px on inputs and floating layers,
  0 elsewhere. One shadow token (`shadow-float`) for dialog and toast only.
- More space above a section head (24px) than below (8px).

## Components and states

### Commands

Actions are bracketed commands in Martian Mono: `[ copy ]`, `[ reveal ]`, `[ rename ]`,
`[ delete ]`. Rest: brackets `ink-muted`, word `ink`. Hover: word underlined. Focus: brackets
take `focus` color plus a 2px `focus` outline offset 2px (never removed; inset on full-width
index lines). Active: brackets close in by 2px (transform only). Disabled: struck through at 70%
opacity. Only `[ delete ]` uses `status-expired`; bulk commands (`[ clear expired ]`,
`[ clear all ]`) stay neutral and are guarded by a confirm dialog instead. Hit area is at least
24px tall (WCAG 2.5.8, `min-h-6`, covered by an E2E check). The primary command (`[ add token ]`)
is inverted: `ink` ground, `surface` text and brackets. Reveal/hide toggles carry `aria-pressed`;
copy reads `[ copied ]` for 1.2s. Copy always copies the real, unmasked value (FR-016); masking
protects the screen, not the clipboard.

### Command bar

A row of commands under the title, present on every screen (FR-027): `[ add token ]` (except on
the add screen itself), `[ clear expired ]` (only when any token is expired), `[ clear all ]`
(only when the vault is non-empty), `[ info ]` (except on the info screen), and the language
command last, pushed to the far edge (`ml-auto`). Commands wrap onto a second line rather than
scroll. The list it built from is a plain composed array (`buildNavCommands`), not a hardcoded
row, so a later feature adds its own entry without touching this one or any other command's
condition. `[ clear expired ]` / `[ clear all ]` open the same confirm dialog as any destructive
action, stating the exact count.

The language command shows the current language as its bracketed word (`EN`/`ES`) and its
accessible name states what it switches to ("Switch to Spanish"), itself in the language the
panel is currently in. Choosing it switches immediately (both locales are preloaded) and persists
the choice; without a choice the browser's language is used, English as fallback (FR-025, FR-029).

### Front matter (detail, first viewport)

Token label line first: `Token:` (visually only) then the label as the `h2`, with `[ rename ]`
(inline editor: Enter saves, Escape cancels). Then two columns like an RFC header: left
`Issuer:`, `Subject:`, `Audience:` (label 700, value condensed, breaking anywhere); right
`Status:` over the status word and time left in `text-state`, colored by status. The row wraps by
content: the fields keep a 14rem basis and, when that does not fit beside the status, the status
moves above them (`flex-wrap-reverse`). Issued / Expires follow as relative time over absolute
local time with zone.

### Time ruler (signature)

A graticule of ten equal divisions from `iat` (or `nbf`) to `exp`, drawn as 1px rules in
`line-strong`, with a 2px `now` mark in the status color, clamped to the ends before `nbf` and
after `exp`. No captions under the ends: the timing list above already states both absolute times,
and the figure's accessible name carries start, end and percent consumed. Without `exp` the ruler
is replaced by the words `Never expires`.

### Structure figure (section 1)

The three encoded segments in condensed Martian Mono on `surface-sunken`, colored by part, each
followed by its caption (`header`, `payload`, `signature`) in `text-cite`, like an RFC ASCII
figure; signature masked as `[masked]` with `[ reveal ]` until revealed. `[ copy ]` (the whole
token) sits on the section head line.

### Claim entries (sections 2 and 3)

`"exp"  Expiration Time` (quoted name 700 in part color, title `ink-muted`) with `[ copy ]`
right-aligned on the name line; then the value (condensed, 700); for NumericDate claims (`iat`,
`nbf`, `exp`, `auth_time`) the absolute local date on its own line; then the one-line summary and
the citation `RFC 7519, Section 4.1.4` in `text-cite` (citation never wraps internally). Masked
values render `[masked]` with `[ reveal ]`. Custom claims omit the title and citation.

### JSON (section 4)

Header and payload as indented JSON on `surface-sunken`, each with a visible caption
(`header JSON`) and `[ copy ]`. Personal claims read `[masked]` inside the payload JSON
until its `[ reveal ]` (placed above the block) shows the real values.

### Index (list view)

Like an RFC index: label (truncated), dotted leader in `ink-muted`, status word and time left in
status color (condensed, pushed right, wraps under the label when needed); second line tail
`…a9F3kQ2x` (ellipsis character), source (`manual`, `cookie`) and lifetime in `ink-muted`. Each
line is one button named by label and status. Hover and focus use `surface-raised`. A count line
(`N tokens`) sits above the list; clearing lives in the command bar above the whole screen, not
here. Returning from a detail restores the scroll position and focuses the line that was opened.

### Info view

Reached by `[ info ]` from any screen (FR-028); `[ back ]` returns to that same screen, not always
the list. `h2` title (focused on open), one paragraph of purpose, then numbered sections for what
is stored, what is not, and a built-versus-planned roadmap summary, exactly like a detail's
sections. The version sits opposite `[ back ]` on the first line, in `text-cite`.

### Other

Add token: `h2` title (focused on open), labeled textarea (`Token`), helper text, error text below
naming the exact problem. Empty state: two sentences of purpose; `[ add token ]` is not repeated
here, since the command bar above already offers it on every screen, including an empty list.
Loading: three index lines as static sunken bars, no spinner. Confirm dialog: native `<dialog>` on
the `scrim` backdrop. Undo toast: floating bar with `shadow-float`, pinned to the bottom gutter;
the list gains bottom padding while it shows so it never covers the last line. It pauses its timer
while hovered or focused (WCAG 2.2.1); the deletion is announced by a persistent status region in
the shell, not by the toast.

## Motion

Built: one transition. Command brackets close in by 2px on press (150ms, transform). Everything
else changes state instantly: screens swap without a slide, reveal replaces text, the deleted line
disappears and the toast appears. The copied confirmation is a text change (`[ copied ]` for
1.2s), not an animation. No ambient animation; countdown text changes without animating.
`prefers-reduced-motion: reduce` makes every transition instant.

Deferred (not built, only if a later feature needs it): detail slide-in, reveal cross-fade,
deleted-line collapse. Any addition stays under 200ms, transform/opacity only.

## Copy voice

Plain, precise, developer-to-developer: "The payload isn't valid JSON." No exclamation marks,
no emoji, no em-dashes in UI strings. Explanations are one line, written like an RFC summary.
