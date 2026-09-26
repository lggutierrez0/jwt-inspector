# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three audiences, all technical, all working inside a browser tab they are debugging:

- **Backend and frontend developers** debugging login, sessions and API calls several times a
  day. They need to know in a glance which token is in play, whether it is alive, and what it
  claims.
- **QA and testers** validating authentication flows, expirations and roles across environments.
  They compare tokens and care where each token came from.
- **Pentesters and security reviewers** auditing tokens for bad practices. They care about
  algorithms, dangerous header parameters, claim hygiene and the security score.

## Product Purpose

A browser side panel that finds, explains, verifies and creates JSON Web Tokens without the
token ever leaving the browser. Success: users stop pasting live credentials into websites, and
answer "which token, still valid, what does it claim, is it safe" faster than with any other
tool.

## Positioning

All four together, which no neighboring tool offers at once:

- **Local by construction**: no server, no telemetry; the only network request is a JWKS URL the
  user asks to fetch.
- **Automatic detection**: tokens from cookies, storage, requests and (opt-in) bodies and logs of
  the active tab, labeled with their source.
- **Instant diagnosis**: status, time left, lifetime and a cited 1-10 security score readable
  without reading JSON.
- **All in one panel**: inspect, verify and create tokens side by side with the page.

## Operating Context

Used next to the page being debugged, often alongside browser devtools, on narrow side panels
(320-480px). Frequent short visits during the day; sometimes during screen sharing or pair
programming, where exposed credentials matter. Tokens come from local, staging and production
environments.

## Capabilities and Constraints

- Planned capabilities and order: `docs/roadmap.md`; current feature specs: `specs/`.
- Chromium (side panel) and Firefox (sidebar), Manifest V3; English and Spanish.
- Privacy and security rules are binding: `.specify/memory/constitution.md` (least privilege,
  extension-private storage, masked-by-default sensitive values, read-only toward pages).
- JWE is recognized but not supported yet (deferred).

## Brand Commitments

- Name: **JWT Inspector** (fixed).
- No existing logo, palette or voice; these are open design decisions.

## Evidence on Hand

None yet: no users, testimonials, metrics or store listing. Future work must not invent them.

## Product Principles

1. The token is the interface: structure and time are the primary information, not decoration.
2. Private by default: nothing sensitive is shown, stored or sent unless the user chooses to.
3. Answer before explaining: status and risk first, details one step away.
4. One place for the whole token lifecycle: find, understand, verify, create.
5. Fast for daily use: every frequent action is one interaction away and keyboard reachable.

## Accessibility & Inclusion

WCAG 2.2 AA, full keyboard operation, light and dark themes, reduced motion respected, usable at
320px width, English and Spanish.
