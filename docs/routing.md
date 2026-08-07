# Routing

## Purpose

This document records the current routing design for the static Org-file blog.

The goal is to understand how Next.js App Router maps URLs to files, when pages
are generated, and which failures should become 404 responses.

## Current Route Map

| URL                  | App Router file                     | Purpose             |
| -------------------- | ----------------------------------- | ------------------- |
| `/`                  | `src/app/page.tsx`                  | Home page           |
| `/blog`              | `src/app/blog/page.tsx`             | Blog index          |
| `/blog/[slug]`       | `src/app/blog/[slug]/page.tsx`      | Blog article detail |
| unknown route        | `src/app/not-found.tsx`             | Site-level 404      |
| missing article slug | `src/app/blog/[slug]/not-found.tsx` | Article-level 404   |
| invalid article slug | `src/app/blog/[slug]/not-found.tsx` | Article-level 404   |

## Blog Detail Route

`/blog/[slug]` is a dynamic route.

At the current project stage, valid article routes come from Org files under
`content/`. For example:

- `content/test-article.org` creates `/blog/test-article`.
- If `content/missing.org` does not exist, `/blog/missing` should be 404.

The detail route uses `generateStaticParams()` to return the slug list from the
current Org files. It also sets `dynamicParams = true`.

This means the intended behavior is:

- Known slugs are generated from the Org files at build time.
- Unknown slugs can reach `src/app/blog/[slug]/page.tsx`.
- The page checks the article repository result and calls `notFound()` when the
  article does not exist.
- Missing or invalid article slugs use article-level 404 UI with a link back to
  `/blog`.
- Adding a new Org file after a production build requires another build before
  the article is pre-generated. It may still reach the route at runtime, but the
  current static Org-file deployment model should be treated as rebuild-based.

## Missing Article Policy

An unavailable article route is a 404, not a generic application error.

This includes:

- A slug that does not correspond to an Org file.
- A slug rejected by the current slug validation rule.

The reason is that the user-visible result is the same: there is no public
article resource at that URL.

Invalid slugs should not expose filesystem paths, validation details, or internal
security reasoning to the browser.

With `dynamicParams = true`, a slug that was not returned by
`generateStaticParams()` reaches `src/app/blog/[slug]/page.tsx`. The page then
loads the article by slug. If the repository returns `null`, the page calls
`notFound()` and the article-level 404 UI from
`src/app/blog/[slug]/not-found.tsx` is rendered.

This makes `/blog/missing` different from `/unknown-route`:

- `/blog/missing` is an article route whose article resource does not exist, so
  it links back to `/blog`.
- `/unknown-route` is not a known site route, so it uses the site-level 404 and
  links back to `/`.

The tradeoff is that unknown article slugs now reach the page before becoming 404. Therefore, filesystem access must remain protected by repository-level slug
validation. The current validation allows only `a-z`, `A-Z`, `0-9`, `_`, and
`-`. Invalid slugs return `null` before `readFile()` is called.

## Error Policy

Use 404 behavior when the requested public resource does not exist.

Current 404 cases are:

- A slug rejected by the slug validation rule.
- A valid slug whose Org file does not exist.
- A slug that was not returned by `generateStaticParams()` and has no matching
  Org file.
- An unknown site route that does not match any App Router file.

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

## Build-Time Error Policy

In the current static Org-file model, `/blog` is generated as static content
during `next build`.

Therefore, article list failures should primarily be treated as build failures,
not as runtime states that need a recovery UI for readers.

For the current project stage, this means:

- Do not catch `readdir(content/)` failures and replace them with an empty list.
- Do not hide unexpected file read failures as missing posts.
- Let build-time failures fail the build so broken content is not deployed.
- Do not add complex runtime fallback UI for article list failures yet.

This should be reconsidered if the article list becomes runtime data, such as:

- fetching from a NestJS API
- reading from a database
- using ISR or runtime revalidation
- allowing article changes without a full rebuild

At that point, list-fetching errors may become runtime user-visible failures and
should be handled with segment-level error UI, retry behavior, and server-side
logging.

## Current Learning Questions

The owner should be able to explain:

- Which file handles `/blog/test-article`?
- Why `/blog/missing` becomes 404.
- Why `/blog/missing` uses article-level 404 but `/unknown-route` uses
  site-level 404.
- Why adding `content/new.org` after production build does not immediately make
  `/blog/new` part of the pre-generated route list.
- Why invalid slug input is treated as no public article resource.
- Why slug validation is still required when `dynamicParams = true`.
- Which failures should be 404 and which should be errors.
