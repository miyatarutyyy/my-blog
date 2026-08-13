# Testing Policy

## Purpose

This document records what each test layer is responsible for in the current
static Org-file blog.

The goal is not to test every implementation detail. The goal is to verify the
public behavior and contracts that must keep working while learning and changing
the Next.js implementation.

## Current Test Layers

### Unit Tests

Command:

```sh
pnpm test:unit
```

Current files:

- `tests/unit/posts.test.ts`
- `tests/unit/org.test.ts`

Unit tests verify server-side content contracts:

- Org files under `content/` become article slugs.
- non-Org files and directories are ignored.
- invalid slugs do not reach filesystem reads.
- missing posts become `null`.
- unexpected filesystem errors are thrown.
- required metadata such as `#+TITLE` and `#+DATE` is validated.
- dates use the expected `YYYY-MM-DD` format.
- Org content can be converted to HTML.

These tests run without a Next.js server. They are the fastest place to verify
repository behavior and security-sensitive slug validation.

### Development E2E Tests

Command:

```sh
pnpm test:e2e
```

Current file:

- `tests/e2e/routing.spec.ts`

Development E2E tests run against `next dev`.

They verify route behavior while developing:

- `/` renders the home page.
- `/blog` renders the article list.
- `/blog/test-article` renders article detail content.
- article detail metadata includes the article title.
- missing article slugs return article-level 404 UI.
- invalid article slugs return article-level 404 UI.
- unknown site routes return site-level 404 UI.

This layer verifies user-visible HTTP behavior without relying only on unit
tests.

### Production E2E Tests

Commands:

```sh
pnpm build
pnpm test:e2e:prod
```

Production E2E tests run against the built app with `next start`.

They verify that the generated production app behaves like the development
server for the public routes readers use. This matters because static generation,
`generateStaticParams()`, `dynamicParams`, and production 404 handling can differ
from assumptions made while using `next dev`.

The production E2E config uses port `3001` so it can run locally without
colliding with the development E2E server on port `3000`.

## CI Checks

Current CI runs:

```sh
pnpm format:check
pnpm lint
pnpm test:unit
pnpm build
pnpm test:e2e:prod
```

CI intentionally runs production E2E after `pnpm build`, because
`test:e2e:prod` depends on the `.next` build output.

The regular development E2E command is useful locally, but CI prioritizes the
production route behavior that readers will see after deployment.

## Current Gaps

The current test setup does not yet cover:

- visual regression of article styling.
- browser-rendered accessibility checks.
- tests against a deployed Vercel Preview URL.
- admin flows, authentication, authorization, or article mutations.
- cache revalidation after dynamic content updates.

Those gaps are acceptable for the current static blog stage. They should be
reconsidered when the project adds dynamic data, admin UI, a backend API, or
authentication.

## Learning Questions

The owner should be able to explain:

- Why slug validation is tested at the unit-test layer.
- Why `/blog/missing` is tested in E2E instead of only unit tests.
- What `next dev` E2E can catch that unit tests cannot.
- What production E2E can catch that development E2E may miss.
- Why CI runs `pnpm build` before `pnpm test:e2e:prod`.
