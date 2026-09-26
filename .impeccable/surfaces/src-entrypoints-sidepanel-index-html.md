---
version: 1
slug: 'src-entrypoints-sidepanel-index-html'
primary_target: 'src/entrypoints/sidepanel/index.html'
related_targets: ['src/ui']
---

# Surface brief: side panel (list, add, detail)

Scope: the whole side panel for feature 001 (token list, add token, token detail). Mode: Operate.
Audience and job: developers, QA and pentesters checking which token is in play, whether it is
alive, what it claims, in short visits beside the page they debug (PRODUCT.md).
Constraints: 320-480px wide, light and dark, en/es, WCAG 2.2 AA, no remote assets, masked by
default. Build path: code-led (no image generation in this environment).

## Direction contract

THESIS: The panel is set like the specification it inspects. A token reads as an Internet-Draft:
front matter answers who and until when, sections carry their real RFC citations. It refuses the
category default of a colored token over two JSON panes.

OWN-WORLD: Plain-text fixed-pitch page. Martian Mono Variable only: condensed width for token
data, normal width for heads, labels, commands and prose. Cool paper and ink, one-pixel rules, no cards, no radius beyond 2px, no shadow
except floating layers. Chroma is reserved for meaning: three part hues (header, payload,
signature) and four time states. Controls read as bracketed commands; focus is a bracket mark.

STORY: The user sees status and time left before anything else, trusts the reading because every
claim cites its source, and acts (copy, reveal, rename) without leaving the page.

FIRST VIEWPORT: Detail at 320px: label line; two-column front matter (Issuer, Subject, Audience
left; Status and time left right, largest type on screen); time ruler with ten-division
graticule from iat to exp and a now mark; then section "1. Structure" with the three segments.
List: an index with dotted leaders from label to time left.

FORM: RFC / Internet-Draft plain-text document, position 6 of 7 on the ordered list, seed key
12a1d735. Raises kept from challengers: ten-division graticule (oscilloscope), one-pixel rules
and printed-mark states (reference setting), hierarchy by scale and weight alone (type
specimen, festival lineup), zones named by their literal term (industrial labels).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
