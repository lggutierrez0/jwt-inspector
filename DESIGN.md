# DESIGN.md — JWT Inspector

Living design spec. Read before any UI change; update when a durable visual decision is made.
Tokens below are mirrored 1:1 as Tailwind v4 `@theme` variables in
`src/assets/styles/tailwind.css`. Components use tokens only — no arbitrary values.

> **Status: pre-build direction (2026-09-26).** Chosen through impeccable's new-work flow
> (seed `12a1d735`, direction contract in `.impeccable/surfaces/`). At the end of feature 001 this
> file is regenerated from the built UI (`impeccable document`) and must then describe reality.

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

| Token            | Light                    | Dark                    | Use                                  |
| ---------------- | ------------------------ | ----------------------- | ------------------------------------ |
| `surface`        | `oklch(0.985 0.004 250)` | `oklch(0.19 0.025 265)` | Page                                 |
| `surface-raised` | `oklch(1 0 0)`           | `oklch(0.23 0.028 265)` | Floating layers, selected index line |
| `surface-sunken` | `oklch(0.955 0.006 250)` | `oklch(0.16 0.022 265)` | Inputs, raw parts, figures           |
| `ink`            | `oklch(0.24 0.03 265)`   | `oklch(0.95 0.008 255)` | Text                                 |
| `ink-muted`      | `oklch(0.48 0.025 262)`  | `oklch(0.74 0.02 258)`  | Citations, leaders, captions         |
| `line`           | `oklch(0.9 0.008 255)`   | `oklch(0.32 0.03 265)`  | 1px rules (decorative)               |
| `line-strong`    | `oklch(0.62 0.02 258)`   | `oklch(0.54 0.03 262)`  | Input borders, graticule (≥ 3:1)     |
| `part-header`    | `oklch(0.52 0.2 355)`    | `oklch(0.75 0.16 355)`  | Header segment and section           |
| `part-payload`   | `oklch(0.5 0.2 290)`     | `oklch(0.74 0.15 295)`  | Payload segment and section          |
| `part-signature` | `oklch(0.5 0.1 205)`     | `oklch(0.8 0.11 200)`   | Signature segment and section        |
| `status-valid`   | `oklch(0.5 0.13 150)`    | `oklch(0.78 0.15 150)`  | Valid                                |
| `status-soon`    | `oklch(0.52 0.13 65)`    | `oklch(0.83 0.14 80)`   | Expires soon (≤ 10% life or ≤ 5 min) |
| `status-expired` | `oklch(0.52 0.19 27)`    | `oklch(0.72 0.17 25)`   | Expired, destructive commands        |
| `status-future`  | `oklch(0.5 0.14 245)`    | `oklch(0.77 0.12 245)`  | Not yet valid                        |
| `focus`          | `oklch(0.5 0.12 215)`    | `oklch(0.8 0.11 210)`   | Focus marks, links                   |

Rules: color never carries meaning alone (status is always also a word); tints are named tokens
built with `color-mix(in oklch, <token> 12%, transparent)`; theme follows `prefers-color-scheme`.

## Typography: one family, fixed pitch

- **Martian Mono Variable** sets everything. One file carries both axes the design uses:
  - `wdth 75` (condensed) for token data, claim values, times and the index: ~45 columns at
    320px, so encoded segments and long values stay readable in a narrow panel.
  - `wdth 100` (normal) for section heads, front-matter labels, commands and explanatory prose.
- Bundled from Fontsource (`@fontsource-variable/martian-mono`, latin + latin-ext, ~60 KB total).
  No remote fonts.
- Rejected: Iosevka (≈1 MB per weight even when subset to latin: over the bundle budget);
  JetBrains Mono and IBM Plex (category defaults).

| Token        | Size / leading | Weight | Use                                           |
| ------------ | -------------- | ------ | --------------------------------------------- |
| `text-cite`  | 12px / 16px    | 400    | Citations, leaders, captions                  |
| `text-body`  | 13px / 20px    | 400    | Values and rows (wdth 75), prose (wdth 100)   |
| `text-label` | 13px / 20px    | 700    | Field names in front matter, claim names      |
| `text-head`  | 14px / 20px    | 700    | Section heads (`2.  Payload claims`)          |
| `text-state` | 22px / 26px    | 700    | Status word and time left (largest on screen) |

Hierarchy comes from weight and one size jump (13 → 22), never from color or decoration.
Sentence case; section numbers are real document structure, not ornament; no em-dashes in UI copy.

## Space, rules, shape

- Grid: 1ch columns horizontally (Martian Mono ch), 4px vertical baseline steps (`1`=4 … `6`=24).
  Gutter 12px at 320px, 16px from 400px.
- Structure is drawn with 1px rules only. No cards. Radius 2px on inputs and floating layers,
  0 elsewhere. One shadow token (`shadow-float`) for dialog and toast only.
- More space above a section head (24px) than below (8px).

## Components and states

### Commands

Actions are bracketed commands in Martian Mono: `[ copy ]`, `[ reveal ]`, `[ rename ]`,
`[ delete ]`. Rest: brackets `ink-muted`, word `ink`. Hover: word underlined. Focus: brackets
and word take `focus` color plus a 1px outline offset 2px (never removed). Active: brackets
close in by 1ch (transform only). Disabled: struck through, `ink-muted`. Destructive commands
use `status-expired`. Hit area is at least 24×24px (WCAG 2.5.8) via padding. The primary command
(`[ add token ]`) is inverted: `ink` ground, `surface` text.

### Front matter (detail, first viewport)

Two columns like an RFC header: left `Issuer:`, `Subject:`, `Audience:` (label 700, value 400,
long values wrap within the column); right `Status:` over the status word and time left in
`text-state`, colored by status. Below 360px the right column moves above the left.

### Time ruler (signature)

A graticule of ten equal divisions from `iat` (or `nbf`) to `exp`, drawn as 1px rules in
`line-strong`, with a `now` mark in the status color and absolute times (local, with time zone
name) under both ends. States: before `nbf` the mark sits left of the scale with an arrow;
after `exp` it sits right; without `exp` the ruler is replaced by the words `Never expires`.

### Structure figure (section 1)

The three encoded segments in condensed Martian Mono, colored by part, separated by `.`, each underlined by a
bracket caption (`header`, `payload`, `signature`) like an RFC ASCII figure; signature masked
as `[masked]` until revealed. `[ copy token ]` sits on the section head line.

### Claim entries (sections 2 and 3)

`"exp"  Expiration Time` (name 700 in part color, title 400) then value, then citation
`RFC 7519, Section 4.1.4` in `text-cite`. Commands align right on the name line. Masked values
render `[masked]` with `[ reveal ]`. Custom claims omit the title and citation.

### Index (list view)

Like an RFC index: label, dotted leader in `ink-muted`, time left in status color; second line
tail `...a9F3kQ2x`, source (`manual`, `cookie`) and lifetime in `text-cite`. Selected line uses
`surface-raised`. Toolbar line above: count, then `[ clear expired ]` (only when any) and
`[ clear all ]`.

### Other

Add token: labeled textarea (`Token`), helper text, error text below naming the exact problem.
Empty state: two sentences of purpose (wdth 100) plus `[ add token ]`. Loading: index lines as
skeleton rules, no spinner. Confirm dialog and undo toast: floating layers with `shadow-float`.

## Motion

Only in answer to an action, 150–200ms, transform and opacity: detail slides in from the right;
copied command reads `[ copied ]` for 1.2s; revealed value cross-fades; deleted index line
collapses. No ambient animation; countdown text changes without animating.
`prefers-reduced-motion: reduce` makes every transition instant.

## Copy voice

Plain, precise, developer-to-developer: "The payload isn't valid JSON." No exclamation marks,
no emoji, no em-dashes in UI strings. Explanations are one line, written like an RFC summary.
