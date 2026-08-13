# Current Learning Focus: Routing and Error Handling

## Context

This project is a personal technical blog for learning Next.js.

The current implementation reads static Org files from `content/` and renders:

- `/`
- `/blog`
- `/blog/[slug]`
- `/blog/[slug]/not-found`

At this stage, the project should continue with static Org files instead of introducing a database, NestJS API, admin UI, or authentication too early.

## Current Hypothesis

The current hypothesis is:

- Static Org files are enough for the next learning stage.
- `/blog` and `/blog/[slug]` are mainly rendered on the server side.
- Before adding admin features or authentication, the project should first clarify routing, data loading, caching assumptions, and error handling.
- Among those topics, routing and error handling should be stabilized first because the current code already has dynamic routes and `notFound()` behavior.

## Focus For The Next Stage

For the next stage, prioritize understanding and improving:

- App Router route structure
- Static routes and dynamic routes
- `generateStaticParams()`
- `dynamicParams`
- 404 behavior with `notFound()`
- Segment-level `not-found.tsx`
- Segment-level `error.tsx` when needed
- How route behavior changes when Org files are added, removed, or renamed

The goal is not only to make the pages work, but to be able to explain:

- Which URL maps to which file under `src/app`
- Whether the route is static or dynamic
- When the route is generated
- What happens when a slug does not exist
- What kind of failure should become 404
- What kind of failure should become an error page

## Current Boundaries

For now, do not add:

- Admin article creation or editing
- Authentication or authorization
- NestJS integration
- Database persistence
- Route Handlers only for the sake of adding an API layer
- Client-side data fetching for public article pages

These topics should be reconsidered after the static blog routing and error behavior can be explained clearly.

## Suggested Work Order

1. Document the current route map.
2. Confirm `/blog/[slug]` behavior for existing and missing slugs.
3. Improve `not-found.tsx` for article detail pages if needed.
4. Decide which failures should use `notFound()` and which should throw.
5. Add `error.tsx` only when there is a real error case to represent.
6. Add tests or build-time checks for public routing behavior.
7. Revisit caching and rendering policy after route behavior is stable.

## Verification Questions

Before moving to the next topic, the owner should be able to answer:

- If a new Org file is added under `content/`, when does its route become available?
- Why does `/blog/[slug]` use `generateStaticParams()`?
- What does `dynamicParams = true` change?
- Why is a missing article a 404 instead of a generic error?
- Why does a missing article use article-level 404 while an unknown site route uses site-level 404?
- Why is repository-level slug validation still required when unknown article slugs can reach the page?
- What kind of Org parsing or filesystem failure should not be hidden as an empty result?
