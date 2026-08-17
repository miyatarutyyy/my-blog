# ADR 0002: Subset SoukouMincho Web Font

## Context

The site uses SoukouMincho for a small amount of display text on the home page,
404 page, and loading UI.

The original local TTF is 9,815,820 bytes. In production, Chrome DevTools
observed a transfer size of about 5.59 MB for the font when cache was disabled.

## Problem

The browser downloads the full TTF even though the current UI needs only a small
set of glyphs. This increases first-visit network cost for a decorative display
font.

## Options

### Option A: Keep serving the original TTF

This has no build tooling cost and avoids missing glyphs, but keeps the current
large transfer.

### Option B: Generate a manual corpus WOFF2 subset

Humans maintain the required text corpus. A script generates a WOFF2 subset and
checks that every corpus character exists in both the source and generated font.

### Option C: Automatically collect used characters from the application

The application marks SoukouMincho text with `data-font="soukou"`, then tooling
collects text from those elements and generates the subset.

## Chosen Option

Use Option B for Phase 1.

## Reason

Phase 1 should prove that subsetting works and measure the size reduction before
adding automatic collection. A manual corpus keeps the implementation small and
makes missing glyphs visible as an explicit maintenance task.

The generated WOFF2 keeps the existing `next/font/local` integration and CSS
variable. It changes the shipped asset, not the Server Component or Client
Component boundary.

## Downsides

The manual corpus can drift when display text changes. `SkkTyping` also renders
intermediate text, candidates, and markers, so the corpus must include more than
only final visible labels.

The generated font is a modified font file. The repository must keep license and
source information with the font files, and must re-check the upstream font
archive for any Reserved Font Name declaration when replacing the source font.

## Conditions for Reconsideration

Reconsider this decision when:

- The manual corpus misses text in production.
- SoukouMincho usage expands beyond a few display elements.
- Phase 2 introduces `data-font="soukou"` collection.
- The source font or its license metadata changes.
