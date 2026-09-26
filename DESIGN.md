# DESIGN.md — JWT Inspector

Living design spec. Read before any UI change; update when a durable visual decision is made.
Tokens below are mirrored 1:1 as Tailwind v4 `@theme` variables in
`src/assets/styles/tailwind.css`. Components use tokens only — no arbitrary values.

## Design read

A precision instrument that sits beside the page a developer is debugging. Users glance at it
dozens of times a day to answer three questions: _which token is this, is it still alive, what
does it claim?_ Density is high, chrome is low, and nothing competes with the token itself.

## Identity: the token's own anatomy

A JWT is `header.payload.signature`. Those three parts own three hues, and every screen uses
them consistently — in the token strip, section markers, JSON keys and copy targets. Users learn
the mapping once and read the whole UI through it. Status colors describe _time_, the second
axis of the product. There is no decorative accent color beyond these meanings.

## Color tokens

Values in OKLCH. Every text color below passes WCAG 2.2 AA (≥ 4.5:1) against `surface`,
`surface-raised` and `surface-sunken` in its theme (verified numerically, 2026-09-26).

| Token            | Light                    | Dark                    | Use                                  |
| ---------------- | ------------------------ | ----------------------- | ------------------------------------ |
| `surface`        | `oklch(0.985 0.004 250)` | `oklch(0.19 0.025 265)` | Panel background                     |
| `surface-raised` | `oklch(1 0 0)`           | `oklch(0.23 0.028 265)` | Selected row, dialogs, toasts        |
| `surface-sunken` | `oklch(0.955 0.006 250)` | `oklch(0.16 0.022 265)` | Code blocks, raw parts, inputs       |
| `ink`            | `oklch(0.24 0.03 265)`   | `oklch(0.95 0.008 255)` | Primary text                         |
| `ink-muted`      | `oklch(0.48 0.025 262)`  | `oklch(0.74 0.02 258)`  | Secondary text, captions             |
| `line`           | `oklch(0.9 0.008 255)`   | `oklch(0.32 0.03 265)`  | Dividers (decorative, not essential) |
| `line-strong`    | `oklch(0.62 0.02 258)`   | `oklch(0.54 0.03 262)`  | Input and control borders (≥ 3:1)    |
| `part-header`    | `oklch(0.52 0.2 355)`    | `oklch(0.75 0.16 355)`  | Header segment                       |
| `part-payload`   | `oklch(0.5 0.2 290)`     | `oklch(0.74 0.15 295)`  | Payload segment                      |
| `part-signature` | `oklch(0.5 0.1 205)`     | `oklch(0.8 0.11 200)`   | Signature segment                    |
| `status-valid`   | `oklch(0.5 0.13 150)`    | `oklch(0.78 0.15 150)`  | Valid, time left comfortable         |
| `status-soon`    | `oklch(0.52 0.13 65)`    | `oklch(0.83 0.14 80)`   | Expires soon (≤ 10% life or ≤ 5 min) |
| `status-expired` | `oklch(0.52 0.19 27)`    | `oklch(0.72 0.17 25)`   | Expired, destructive actions         |
| `status-future`  | `oklch(0.5 0.14 245)`    | `oklch(0.77 0.12 245)`  | Not yet valid                        |
| `focus`          | `oklch(0.5 0.12 215)`    | `oklch(0.8 0.11 210)`   | Focus ring, links                    |

Rules:

- Color never carries meaning alone: every status also has an icon and a text label.
- Tinted fills use the same hue at low chroma via `color-mix(in oklch, <token> 12%, transparent)`,
  defined as named tokens (`part-header-tint`, `status-expired-tint`, …), never inline.
- Primary buttons are `ink` on `surface` inverted (ink background, surface text: 15.8:1 light,
  16:1 dark). Destructive confirmations use `status-expired`.
- Theme follows `prefers-color-scheme`; both themes are first-class and tested.

## Typography

- **UI**: IBM Plex Sans Variable — engineered, slightly technical, excellent at small sizes.
- **Token data**: JetBrains Mono Variable — tokens, claim values, JSON, times. Monospace is used
  for _data_, never for labels or decoration.
- Both fonts are bundled (latin + latin-ext); no remote font requests.

| Token       | Size / line-height | Weight | Use                                                                         |
| ----------- | ------------------ | ------ | --------------------------------------------------------------------------- |
| `text-xs`   | 12px / 16px        | 450    | Captions, source badges, timestamps                                         |
| `text-sm`   | 13px / 18px        | 450    | Mono data, claim values                                                     |
| `text-base` | 14px / 20px        | 450    | Body, list labels                                                           |
| `text-lg`   | 16px / 22px        | 600    | Section titles in detail                                                    |
| `text-xl`   | 20px / 26px        | 650    | Detail status headline ("Valid · 2 h left" is two elements, not one string) |

14px body is deliberate: the side panel is a dense developer tool (320–480px wide). Nothing
renders below 12px. Sentence case everywhere; no all-caps labels, no tracked-out eyebrows.

## Space, shape, depth

- Spacing scale: 4px base (`1`=4, `2`=8, `3`=12, `4`=16, `6`=24). Panel gutter 12px at 320px,
  16px from 400px.
- Radius by hierarchy, not one value everywhere: controls 6px, popovers/dialogs 10px, token
  strip segments 3px, status pills fully rounded.
- Depth only for layers that float: dialogs and toasts get one shadow token (`shadow-float`).
  The list and detail content have no shadows and no cards.

## Layout

### Header (always visible)

Product name, version (`v0.1.0`, mono, muted), and the "Add token" action. Help (009) will add
an info button here.

### List view

- Rows separated by `line`, full-bleed, 56px min height, whole row is the hit target.
- Row anatomy: left — label (base, ink) over tail `…a9F3kQ2x` (mono xs, muted) and source badge;
  right — status time ("12 min left" / "Expired 3 d ago" / "Never expires") colored by status,
  over total lifetime (xs, muted).
- A 2px lifetime bar along the row's bottom edge shows life consumed, in the status color.
- Toolbar above the list: count, "Clear expired" (only if any expired), "Clear all".
- Empty state: one sentence of purpose, the "Add token" button, and a sample of what a row shows.

### Detail view

Order is fixed by FR-013 and optimized for the first glance (SC-002: status visible without
scrolling at 320px):

1. **Status block** — status headline with icon, time left, and the **time ruler**: a horizontal
   line from `iat` (or `nbf`) to `exp` with a marker at _now_; ticks labeled with relative
   times. Absolute times with time zone sit under the ruler.
2. **Token strip** — the encoded token in mono, segments colored header / payload / signature,
   signature masked by default; copy whole token.
3. **Header** and **Payload** sections — each claim is a row: name (mono), explanation (muted,
   for registered claims), value; masked values show `••••••` with a reveal toggle; per-row
   copy. Section titles carry the part color as a 3px leading bar.
4. **Raw** — pretty-printed JSON of header and payload with copy.

- Back navigation returns to the list preserving scroll position.
- Label is editable inline at the top (pencil affordance, Enter to save, Esc to cancel).

## Motion

- Only in response to user actions: detail enters from the right (160ms, ease-out); reveal
  swaps value with a 120ms cross-fade; "Copied" confirmation morphs the copy icon to a check
  for 1.2s; deleted row collapses (160ms).
- No ambient animation. The countdown text changes, it does not animate.
- `prefers-reduced-motion: reduce` → all transitions become instant.

## Components (inventory for 001)

`AppHeader`, `TokenList`, `TokenRow`, `SourceBadge`, `StatusTime`, `LifetimeBar`,
`AddTokenForm`, `TokenDetail`, `TimeRuler`, `TokenStrip`, `ClaimTable`, `ClaimRow`,
`MaskedValue`, `CopyButton`, `JsonView`, `InlineLabelEditor`, `ConfirmDialog`, `UndoToast`,
`EmptyState`.

## Icons

Lucide, 16px in rows and buttons, 1.75 stroke. Icon-only buttons always have an accessible
name and a tooltip. Status icons: valid `circle-check`, soon `clock-alert`, expired
`circle-x`, not yet valid `clock-arrow-up`, never expires `infinity`.

## Copy voice

Short, precise, developer-to-developer. Say what happened and what to do: "The payload isn't
valid JSON." rather than "Oops! Something went wrong." No exclamation marks, no emoji.
