# ADR 0001: CI/CD with GitHub Actions and Vercel

## Context

This project is a Next.js blog whose public pages are generated from Org files under `content/`.

The current scripts are:

- `pnpm format:check`
- `pnpm lint`
- `pnpm test:unit`
- `pnpm build`
- `pnpm test:e2e:prod`

The intended deployment target is Vercel.

## Problem

We want commits and pull requests to fail before deployment when formatting, linting, unit tests, production build generation, or production-mode route behavior is broken.

We also want a deployment path that is simple enough for the current project stage and still leaves room for later checks such as content snapshots, generated route verification, or end-to-end tests.

## Options

### Option A: GitHub Actions checks and Vercel Git deployment

GitHub Actions runs `format:check`, `lint`, `test:unit`, `build`, and production-mode end-to-end tests against `next start`.

Vercel is connected to the GitHub repository and handles Preview and Production deployments from Git pushes.

### Option B: GitHub Actions builds and deploys to Vercel with the Vercel CLI

GitHub Actions installs the Vercel CLI, pulls Vercel environment configuration, runs `vercel build`, and deploys `.vercel/output` with `vercel deploy --prebuilt`.

This requires GitHub secrets such as `VERCEL_TOKEN`, `VERCEL_ORG_ID`, and `VERCEL_PROJECT_ID`.

## Chosen Option

Use Option A for now.

## Reason

The current project has no private runtime environment variables, backend integration, or custom deployment gate that requires GitHub Actions to own the deployment step.

Keeping GitHub Actions responsible for checks and Vercel responsible for deployment gives a small workflow:

1. Install dependencies from `pnpm-lock.yaml`.
2. Fail on formatting issues.
3. Fail on lint issues.
4. Fail if unit tests for post loading or Org conversion break.
5. Fail if the Next.js production build cannot be created from the current code and content.
6. Fail if the generated production server does not serve the expected public routes.
7. Let Vercel deploy commits through its Git integration.

The `pnpm build` step is the current generated-output check because the generated Next.js routes depend on the Org content read during the build.

The production end-to-end step intentionally runs after `pnpm build` and starts the built app with `next start`. This checks the route behavior readers will see from the generated app, not only the behavior of `next dev`.

## Downsides

GitHub Actions does not currently compare committed content against a separate checked-in generated artifact.

Vercel may still create preview or production deployments unless the Vercel project is configured to require GitHub checks before promotion.

The workflow does not yet include browser-rendered accessibility checks or tests against a deployed Vercel Preview URL.

## Conditions for Reconsideration

Reconsider this decision when:

- Vercel deployments need secrets or build settings that must be controlled only from GitHub Actions.
- We add a generated artifact that should be checked for drift against `content/`.
- We add end-to-end tests that must run against a deployed preview URL before production promotion.
- We need GitHub Actions to produce the exact Vercel Build Output and deploy it with `vercel deploy --prebuilt`.
