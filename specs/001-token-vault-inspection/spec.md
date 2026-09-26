# Feature Specification: Token Vault & Inspection

**Feature Branch**: `001-token-vault-inspection`

**Created**: 2026-09-25

**Status**: Draft

**Input**: User description: "Token vault & inspection (roadmap item 001): paste a JWT manually,
decode and save it; main view lists saved tokens with label, tail, source, time remaining and
total lifetime; a detail view shows everything public with sensitive parts masked, copy actions,
rename; delete one with undo, clear all with confirmation; persistent storage accessible only to
the extension; English and Spanish; JWE recognized but not supported yet."

## Clarifications

### Session 2026-09-25

- Q: Which values are masked by default in the detail view? → A: The signature plus personal or
  secret-looking claims (list in FR-015); everything else is visible.
- Q: What happens to expired tokens over time? → A: They are kept until the user deletes them;
  a "Clear expired" action is offered (FR-023).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Add a token and understand it at a glance (Priority: P1)

A developer has a JWT (copied from a login response, a test fixture or a teammate) and wants to
know what is inside and whether it is still valid, without pasting a credential into a website.
They open the side panel, choose "Add token", paste it, and immediately see its detail: whether it
is valid, expired or not yet valid, how much time is left, and every header parameter and claim
explained in plain language.

**Why this priority**: this is the core value of the product and the minimum useful slice: a
private, offline JWT decoder that explains what it shows. Every later feature builds on it.

**Independent Test**: paste a known token and verify the detail view shows the correct status,
times and decoded values; paste invalid input and verify the specific error message.

**Acceptance Scenarios**:

1. **Given** an empty vault, **When** the user selects "Add token", pastes a well-formed JWT and
   confirms, **Then** the token is saved and its detail view opens showing status, time
   remaining, issued/not-before/expiry times, header parameters and payload claims.
2. **Given** the add-token input, **When** the user pastes text that is not a JWT (wrong number
   of parts, invalid base64url, or a part that is not valid JSON), **Then** nothing is saved and
   a message states which of those problems was found.
3. **Given** a token already in the vault, **When** the user adds the same token again, **Then**
   no duplicate is created and the existing token is shown and highlighted.
4. **Given** a token with an `exp` in the past, **When** its detail is shown, **Then** it is
   marked "Expired" together with how long ago it expired.
5. **Given** a token whose `nbf` is in the future, **When** its detail is shown, **Then** it is
   marked "Not yet valid" together with when it becomes valid.
6. **Given** a token without `exp`, **When** its detail is shown, **Then** it is marked "Never
   expires" and no lifetime progress is shown.
7. **Given** an encrypted token (JWE, five parts), **When** the user adds it, **Then** it is
   recognized as an encrypted token and the user is told that inspecting encrypted tokens is not
   supported yet; the app does not show an error or crash.
8. **Given** the add-token input, **When** the user pastes a token surrounded by whitespace or
   prefixed with `Bearer `, **Then** the token is extracted and added normally.

---

### User Story 2 - See all my tokens and their remaining life (Priority: P2)

A developer juggling several environments and users wants one list of their tokens where each
entry answers "which token is this, where did it come from, and is it still usable?" without
opening it.

**Why this priority**: once more than one token exists, the list is the main view and the
fastest way to pick the right token; it turns a decoder into a daily tool.

**Independent Test**: add several tokens with different expiry situations and verify each list
entry shows the correct label, tail, source, time remaining and total lifetime, updating live.

**Acceptance Scenarios**:

1. **Given** several saved tokens, **When** the user opens the panel, **Then** tokens are listed
   most recently added first, each showing its label, the last characters of the token, its
   source, time remaining and total lifetime.
2. **Given** a listed token that is about to expire, **When** time passes while the panel is
   open, **Then** its time remaining updates without user action and switches to "Expired" at
   the moment of expiry.
3. **Given** a token with claims such as `name`, `email`, `sub` or `iss`, **When** it is added,
   **Then** its default label is derived from the first of those claims that is present; when
   none is present it gets a numbered generic label (e.g. "Token 3").
4. **Given** an empty vault, **When** the user opens the panel, **Then** an empty state explains
   what the tool does and offers the "Add token" action.
5. **Given** a list entry, **When** the user selects it (pointer or keyboard), **Then** its
   detail view opens, and returning to the list keeps the previous scroll position.

---

### User Story 3 - Protect sensitive values and copy what I need (Priority: P3)

While screen sharing or pair programming, a developer wants to inspect a token without exposing
sensitive values, and to copy exactly the piece they need (the whole token, the payload, a single
claim) with one action.

**Why this priority**: safe display and quick copying make the detail view practical in real
work settings, but the product is already useful without them.

**Independent Test**: open a token's detail and verify sensitive values start masked, reveal
and hide per field, and each copy action puts the exact expected text on the clipboard.

**Acceptance Scenarios**:

1. **Given** a token's detail view, **When** it opens, **Then** the signature and sensitive claim
   values are masked (see FR-015) while all other values are visible.
2. **Given** a masked value, **When** the user activates its reveal control, **Then** only that
   value is shown, and activating it again hides it.
3. **Given** the detail view, **When** the user activates a copy control (whole token, header
   JSON, payload JSON, or an individual claim), **Then** the exact unmasked value is copied and a
   brief, accessible confirmation is shown.
4. **Given** the detail view is closed and reopened, **When** it is shown again, **Then** all
   previously revealed values are masked again.

---

### User Story 4 - Keep my vault tidy and private (Priority: P4)

A developer wants their saved tokens to survive browser restarts, to give them meaningful names,
and to remove them individually or all at once, knowing no web page or other extension can read
them.

**Why this priority**: management and persistence make the vault trustworthy over time; they
matter once the user relies on the tool daily.

**Independent Test**: rename, delete (and undo), clear all, restart the browser and verify the
vault state; verify tokens are not readable from a web page context.

**Acceptance Scenarios**:

1. **Given** a token's detail view, **When** the user edits the label and confirms, **Then** the
   new label is shown in the detail and in the list; an empty label or one longer than 60
   characters is rejected with a message and the previous label is kept.
2. **Given** a saved token, **When** the user deletes it, **Then** it disappears from the list and
   an "Undo" option is available for 5 seconds; using it restores the token in its original
   position with its label.
3. **Given** a non-empty vault, **When** the user chooses "Clear all", **Then** a confirmation
   stating how many tokens will be removed is required; confirming empties the vault and
   cancelling changes nothing.
4. **Given** saved tokens, **When** the browser is restarted and the panel reopened, **Then** the
   same tokens, labels and order are shown.
5. **Given** saved tokens, **When** any web page or another extension tries to read them,
   **Then** they are not accessible; tokens are also never synchronized to other devices.
6. **Given** saved tokens that expired long ago, **When** time passes, **Then** they are never
   removed automatically; they stay listed as expired until the user deletes them.
7. **Given** a vault containing expired tokens, **When** the user chooses "Clear expired" and
   confirms, **Then** only the expired tokens are removed; the confirmation states how many.

---

### Edge Cases

- Very long tokens (e.g. 16 KB with large claims) are accepted, displayed without breaking the
  layout at 320px, and long values wrap or scroll within their field.
- Claims with non-standard types are displayed faithfully: `aud` as string or array, numeric
  dates with fractional seconds, nested objects and arrays, `null`, booleans, Unicode text.
- Registered time claims with invalid values (strings, negative numbers, `exp` before `iat`) are
  shown as-is with a warning instead of a misleading status.
- `iat` and `nbf` both missing while `exp` exists: total lifetime is shown as "Unknown" rather
  than a guessed value.
- A token whose header declares `alg: none` or has an empty signature part is decoded and
  displayed (flagging it is the job of the security score, feature 002).
- Text that has three dot-separated parts but whose header lacks `alg` is still accepted as a
  JWT-like token and flagged as missing `alg` in the header section.
- Two panels open in different windows: changes in one (add, rename, delete) appear in the other
  without reloading.
- Storage write failures (e.g. quota exceeded) are reported to the user and do not leave the
  list in an inconsistent state.
- The user's clock is the time reference; the detail view shows the current local time zone
  next to absolute dates so users can reason about skew.

## Requirements _(mandatory)_

### Functional Requirements

**Adding and decoding**

- **FR-001**: Users MUST be able to open an input from an "Add token" action, paste a token and
  confirm with a button or the Enter key.
- **FR-002**: The system MUST trim surrounding whitespace and a leading `Bearer ` prefix
  (case-insensitive) before parsing.
- **FR-003**: The system MUST decode a three-part token into header, payload and signature, and
  reject input with a specific reason: wrong number of parts, invalid base64url in a named part,
  header or payload not valid JSON, header or payload not a JSON object, or token larger than
  64 KiB (the persisted-format limit).
- **FR-004**: The system MUST recognize five-part tokens as encrypted (JWE) and inform the user
  that they are not supported yet, without treating them as malformed.
- **FR-005**: The system MUST NOT save a token that is already in the vault (exact match after
  normalization); it MUST instead bring the existing token into view and highlight it.
- **FR-006**: Each saved token MUST record its source; tokens added through this feature have the
  source "Manual". The set of sources MUST include Manual, Created, Cookie, Local storage, Session
  storage, Request header, URL parameter, Body and Console log, so later features only add
  producers.

**List view**

- **FR-007**: The main view MUST list saved tokens ordered by most recently added first.
- **FR-008**: Each list entry MUST show label, the last 8 characters of the token, a source label,
  a status (valid, expired, not yet valid, never expires) with time remaining or elapsed, and the
  total lifetime.
- **FR-009**: Total lifetime MUST be computed as `exp − iat`, or `exp − nbf` when `iat` is absent;
  it is "Unknown" when neither is present and "Never expires" without `exp`.
- **FR-010**: Time remaining and status MUST update live while visible, at least once per second
  when under one minute remains and at least once per minute otherwise.
- **FR-011**: The default label MUST be the first present of `name`, `email`, `preferred_username`,
  `sub`, `iss`; otherwise "Token N" where N is the next unused number.
- **FR-012**: The empty state MUST explain the purpose of the tool and offer the "Add token"
  action.

**Detail view**

- **FR-013**: The detail view MUST present, in this order: status summary; timing (issued at, not
  before, expires at — each as relative time and absolute local date-time with time-zone name);
  lifetime progress (portion of total lifetime already consumed) when computable; raw encoded
  parts (so the token can be recognized and copied without scrolling far); header parameters;
  payload claims; pretty-printed header and payload JSON.
- **FR-014**: Registered claims (`iss`, `sub`, `aud`, `exp`, `nbf`, `iat`, `jti`) and common
  header parameters (`alg`, `typ`, `cty`, `kid`, `jku`, `jwk`, `x5u`, `x5c`, `x5t`, `x5t#S256`,
  `crit`) MUST show a one-line, human-readable explanation; other claims are shown as custom
  claims.
- **FR-015**: The signature and sensitive claim values MUST be masked by default, each with a
  per-field reveal/hide control; revealed state MUST reset when the detail view is closed.
  Sensitive claims are the personal-data claims `email`, `name`, `given_name`, `family_name`,
  `middle_name`, `nickname`, `phone_number`, `address`, `birthdate`, and any claim (at any
  nesting level) whose name contains `password`, `secret`, `token` or `key`
  (case-insensitive). All other values are shown unmasked.
- **FR-016**: Users MUST be able to copy the whole token, the header JSON, the payload JSON and
  each individual claim value; copying MUST place the unmasked value on the clipboard and show an
  accessible confirmation.
- **FR-017**: Users MUST be able to rename a token's label inline; labels MUST be 1–60 characters
  after trimming.

**Managing the vault**

- **FR-018**: Users MUST be able to delete a single token, with an undo option available for 5
  seconds that restores it with its original label and position.
- **FR-019**: Users MUST be able to clear all tokens after an explicit confirmation stating the
  number of tokens to be removed.
- **FR-020**: The vault MUST persist across browser restarts and MUST be readable only by the
  extension itself: not by web pages, not by other extensions, and never synchronized across
  devices.
- **FR-021**: The vault MUST store only what is needed to show tokens (the token and its user
  metadata); it MUST NOT store secrets or keys in this feature, so that adding encryption later
  (feature 008) only requires encrypting the existing records.
- **FR-022**: Changes made in one open panel MUST be reflected in any other open panel of the same
  browser profile.
- **FR-023**: Tokens MUST never be removed automatically, including expired ones. Users MUST be
  able to remove all expired tokens at once ("Clear expired") after a confirmation stating how
  many will be removed; the action is available only when at least one token is expired.

**Cross-cutting**

- **FR-024**: The panel header MUST show the extension version at all times.
- **FR-025**: All user-facing text MUST be available in English and Spanish, following the
  browser language, with English as fallback.
- **FR-026**: Every action MUST be operable by keyboard with visible focus, all controls MUST have
  accessible names, status changes (copied, deleted, errors) MUST be announced to assistive
  technology, and the layout MUST remain usable at 320px width in light and dark themes.

### Key Entities

- **Token record**: a saved token. Attributes: the normalized token text, its kind (signed or
  encrypted), source, label, date added. Derived (never stored): decoded header and payload,
  status, time remaining, lifetime.
- **Token source**: where a token came from (Manual, Created, Cookie, Local storage, Session
  storage, Request header, URL parameter, Body, Console log), optionally with context such as the
  site or key name for automatic sources.
- **Decoded token**: header parameters, payload claims and signature part of a signed token,
  or the recognized-but-unsupported form of an encrypted token.
- **Token status**: valid, expired, not yet valid or never expires, evaluated against the current
  time.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A user can go from opening the panel to seeing a pasted token's decoded detail in
  under 10 seconds and with no more than 3 interactions.
- **SC-002**: The detail view answers "is this token valid and for how long?" without scrolling
  in a 320×568px panel.
- **SC-003**: 100% of malformed inputs from the test corpus (wrong parts, bad base64url, bad JSON,
  non-object JSON) produce a message naming the specific problem; none are saved.
- **SC-004**: With 200 saved tokens, the list opens and becomes interactive in under 1 second, and
  live countdowns do not visibly stall scrolling.
- **SC-005**: Saved tokens and labels survive a browser restart in 100% of test runs, and no test
  from a web page context can read them.
- **SC-006**: Every interactive element is reachable and operable by keyboard alone, and automated
  accessibility checks report no WCAG 2.2 AA violations in list and detail views, in both themes
  and both languages.
- **SC-007**: Status and time remaining shown in list and detail always agree with each other and
  are never more than 1 second behind the actual expiry moment while visible.

## Assumptions

- Users are developers or testers familiar with JWT basics; explanations are concise, not
  tutorials.
- The user's device clock is the time reference; clock-skew tolerance options are out of scope.
- Duplicate detection compares the normalized token text exactly; the same claims with a
  different signature are different tokens.
- There is no upper limit on vault size beyond what the browser's extension storage allows;
  storage-full errors are reported (see Edge Cases).
- Copying unmasked values to the clipboard is intentional user action; the extension does not try
  to clear the clipboard afterwards (browsers do not allow it reliably).
- Only manual entry produces tokens in this feature; the list and model already accommodate all
  sources for features 004–007.
- Out of scope: security score (002), signature verification (003), token creation (004),
  automatic detection (005–007), vault encryption (008), help view (009), JWE decryption.
