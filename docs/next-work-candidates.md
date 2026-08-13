# Next Work Candidates

## Context

The project currently focuses on learning Next.js through a static Org-file blog.

Recent work clarified:

- App Router route mapping
- static generation for `/blog` and `/blog/[slug]`
- 404 behavior for missing routes and missing posts
- build-time error policy for article list generation
- unit tests for post loading and Org conversion
- E2E tests for public routes

The next work should stay within the static Org-file stage unless there is a
clear reason to move to NestJS, a database, admin UI, or authentication.

## Candidate 1: Article Metadata

Add `generateMetadata()` for article detail pages.

This would make each article expose its own title and description instead of
only using the root metadata.

Learning value:

- how metadata works in App Router
- where metadata code runs
- how metadata depends on server-side data
- how 404 and metadata generation interact

Design questions:

- Should metadata read the same Org source as the page?
- What should happen when the slug is missing?
- Should missing `#+TITLE:` stay as slug fallback?
- Should description be generated now or deferred?

Verification candidates:

- unit test metadata-related helpers if introduced
- E2E or build check for article `<title>`
- `pnpm build` route output remains static

## Candidate 2: Error UI

Add segment-level `error.tsx` only where there is a real error case to represent.

Current policy throws for processing failures, but no custom error UI has been
added yet.

Learning value:

- difference between `not-found.tsx` and `error.tsx`
- which errors are caught by a route segment
- why missing resources should not be shown as generic errors
- why build-time failures may not need runtime recovery UI yet

Design questions:

- Should the blog segment have `src/app/blog/error.tsx`?
- Should article detail have `src/app/blog/[slug]/error.tsx`?
- Which current failures can actually be observed at runtime?
- Should error UI be deferred until data becomes runtime-fetched?

Verification candidates:

- keep current unit tests for thrown errors
- add E2E only if a runtime-observable error state is intentionally introduced
- avoid artificial runtime failure routes just for demonstration

## Candidate 3: 404 UI Polish

Improve the global and article-level 404 pages.

Current pages are functional but minimal.

Learning value:

- how route-level 404 UI is selected
- how `dynamicParams = false` affects which 404 UI appears
- how navigation should guide readers back to valid routes

Design questions:

- Should `/blog/missing` use the global 404 for now?
- Is `src/app/blog/[slug]/not-found.tsx` still needed in the current model?
- Should the UI be Japanese, English, or mixed?
- Should the page link to `/blog`, `/`, or both?

Verification candidates:

- E2E checks for 404 status and visible navigation
- accessibility checks for headings and links

## Candidate 4: Rendering And Cache Notes

Document the current rendering and cache model.

This is likely more useful than adding caching code right now because the
project currently reads local Org files at build time.

Learning value:

- why `/blog` is static
- why `/blog/[slug]` is SSG with `generateStaticParams()`
- why adding Org files requires rebuild
- why runtime revalidation is not needed yet

Design questions:

- What exactly is cached by the deployed static output?
- What changes require a rebuild?
- When would `revalidatePath()` or `revalidateTag()` become relevant?
- How would this change after NestJS or ISR?

Verification candidates:

- `pnpm build` route output
- E2E routes against `next dev`
- optional future production-mode test with `next build` and `next start`

## Candidate 5: Production-Mode Route Test

Add a test path that verifies routes against `next build` and `next start`.

Current E2E tests run against `next dev`. That is useful, but it does not fully
match deployed static output.

Learning value:

- difference between development server and production build
- what static route output means
- how `dynamicParams = false` behaves after build

Design questions:

- Is the extra test runtime worth it now?
- Should this be local-only or CI-only?
- How should Google Fonts/network requirements be handled in CI?

Verification candidates:

- `/`
- `/blog`
- `/blog/test-article`
- `/blog/missing`
- unknown route

## Suggested Next Step

The most useful next step is probably Candidate 4: Rendering And Cache Notes.

Reason:

- it builds directly on the current routing work
- it explains why list errors are build failures in the current model
- it prepares for later cache and revalidation work without adding premature
  runtime caching code

After that, Candidate 1: Article Metadata is a good implementation step because
it is small, user-visible, and still server-side.
