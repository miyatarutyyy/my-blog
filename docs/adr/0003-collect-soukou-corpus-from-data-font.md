# ADR 0003: Collect SoukouMincho Corpus from `data-font`

## Context

Phase 1 used a manually edited corpus to generate the SoukouMincho WOFF2 subset.

The site now needs the corpus to follow the UI more directly without introducing
a React-specific wrapper component such as `SoukouText`.

## Problem

The project needs one source of intent for both "this text uses SoukouMincho"
and "this text belongs in the SoukouMincho subset".

The collector must also avoid silently missing animated `SkkTyping` text, because
`SkkTyping` renders intermediate readings, candidates, and markers that are not
fully visible in the initial HTML.

## Options

### Option A: Collect from built HTML

This observes generated static HTML, but it can require a build before subset
generation and another build after subset generation. It also misses client-only
intermediate `SkkTyping` frames.

### Option B: Collect from browser-rendered DOM

This is closest to runtime display, but depends on timing, viewport, animation
state, and browser automation.

### Option C: Collect from TSX marked with `data-font="soukou"`

The collector runs before build, reads `data-font="soukou"` JSX subtrees, and
special-cases static `SkkTyping` plans. Extra fixed strings can be supplied by
small `*.soukou-corpus.txt` fragments.

## Chosen Option

Use Option C.

## Reason

`data-font="soukou"` becomes the shared contract for styling and corpus
collection. This avoids a custom React wrapper while keeping the marker visible
in rendered markup.

TSX collection runs before the Next.js build, so it does not require a two-pass
build. It can also inspect the static `SkkTyping` plan values that are not
present in the initial HTML.

If a marked subtree contains unresolved dynamic text, the collector fails. This
prevents missing glyphs from dynamic values such as article titles. Future
support for article titles or Org headings should add a content-specific
collector that reads only those declared roles, not whole article bodies.

## Downsides

The collector supports only static JSX patterns that the project currently uses.

Text that is intentionally tied to SoukouMincho but not represented as static
marked JSX still needs a small corpus fragment.

## Conditions for Reconsideration

Reconsider this decision when:

- `data-font="soukou"` is applied to dynamic article data.
- SoukouMincho is used inside Markdown or Org body content.
- The collector starts needing broad JavaScript evaluation instead of static
  syntax inspection.
