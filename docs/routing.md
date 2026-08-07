# Routing

## Purpose

This document records the current routing design for the static Org-file blog.

The goal is to understand how Next.js App Router maps URLs to files, when pages
are generated, and which failures should become 404 responses.

## Current Route Map

| URL                      | App Router file                | Purpose             |
| ------------------------ | ------------------------------ | ------------------- |
| `/`                      | `src/app/page.tsx`             | Home page           |
| `/blog`                  | `src/app/blog/page.tsx`        | Blog index          |
| `/blog/[slug]`           | `src/app/blog/[slug]/page.tsx` | Blog article detail |
| unknown route            | `src/app/not-found.tsx`        | Site-level 404      |
| ungenerated article slug | `src/app/not-found.tsx`        | Site-level 404      |

## Blog Detail Route

`/blog/[slug]` is a dynamic route.

At the current project stage, valid article routes come from Org files under
`content/`. For example:

- `content/test-article.org` creates `/blog/test-article`.
- If `content/missing.org` does not exist, `/blog/missing` should be 404.

The detail route uses `generateStaticParams()` to return the slug list from the
current Org files. It also sets `dynamicParams = false`.

This means the intended behavior is:

- Known slugs are generated from the Org files.
- Unknown slugs are not generated on demand.
- Adding a new Org file after a production build requires another build before
  the route is available.
- A slug that was not returned by `generateStaticParams()` is handled by the
  site-level 404.

## Missing Article Policy

An unavailable article route is a 404, not a generic application error.

This includes:

- A slug that does not correspond to an Org file.
- A slug rejected by the current slug validation rule.

The reason is that the user-visible result is the same: there is no public
article resource at that URL.

Invalid slugs should not expose filesystem paths, validation details, or internal
security reasoning to the browser.

With `dynamicParams = false`, a slug that was not returned by
`generateStaticParams()` does not reach `src/app/blog/[slug]/page.tsx`.
Therefore, `/blog/missing` currently uses the site-level 404 UI from
`src/app/not-found.tsx`.

## Error Policy

Use 404 behavior when the requested public resource does not exist.

Current 404 cases are:

- A slug rejected by the slug validation rule.
- A valid slug whose Org file does not exist.
- A slug that was not returned by `generateStaticParams()`.

Current non-error empty list cases are:

- `content/` exists but contains no Org files.
- `content/` contains only files that do not end with `.org`.

Use an error page or thrown error for failures where the resource may exist but
the system failed to produce the response, such as:

- Org parsing failure
- `content/` cannot be read while building the article list
- Unexpected filesystem failure
- Unexpected data contract failure

Do not silently replace unexpected failures with empty lists or `null`, because
that hides problems that should be fixed.

For filesystem reads, only the "file does not exist" case should become `null`.
Other filesystem failures should be thrown so that Next.js can treat them as
errors instead of article 404s.

Org conversion failures should also be thrown. The article source exists in that
case, but the system failed to produce display HTML from it. That is not an
article 404.

## Current Learning Questions

The owner should be able to explain:

- Which file handles `/blog/test-article`?
- Why `/blog/missing` becomes 404.
- Why adding `content/new.org` after production build does not immediately make
  `/blog/new` available.
- Why invalid slug input is treated as no public article resource.
- Which failures should be 404 and which should be errors.
