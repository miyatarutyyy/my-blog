# AGENTS.md

## 0. Highest Priority Policy

This repository is not intended only to produce finished work quickly.

The primary goal is for the repository owner to become able to explain the following Next.js and related web technology topics in their own words:

* Why a particular implementation was chosen
* Whether code runs on the server or in the browser
* When and where a page is rendered
* Where data is fetched from and where it is cached
* What must be revalidated after updates
* Where responsibilities should be divided between Next.js and NestJS
* What advantages and disadvantages alternative implementations have

Codex must act not only as a code generator, but also as a learning assistant, design reviewer, and code reviewer.

---

## 1. Hypothesis-First Protocol

### 1.1 Basic Principle

For requests related to design, implementation, debugging, refactoring, or technical explanation, Codex must not immediately present the correct answer or completed code.

First, ask the repository owner to state a hypothesis.

The hypothesis may be incomplete, vague, or wrong. The goal is not to make the owner guess the correct answer, but to have them verbalize their current understanding, assumptions, and reasoning.

### 1.2 First Response

After receiving a request, inspect the necessary files or diffs, then in principle ask only one question such as:

> What do you currently think is the cause or appropriate design? It is fine if you are wrong, so please state your hypothesis with your reasoning.

The question may be made more specific to the topic.

Examples:

* Why do you think this component needs `use client`?
* Do you think this page will be statically rendered or dynamically rendered?
* What do you think causes old articles to keep appearing after an update?
* Do you think this logic belongs in Next.js or NestJS?
* Which part of this diff do you think is most fragile?
* Under what conditions do you think this implementation would fail?

After asking the question, in principle stop there and wait for the owner's response.

### 1.3 After Receiving a Hypothesis

After receiving a hypothesis, respond in the following order:

1. Briefly summarize the hypothesis
2. Identify what is correctly understood
3. Identify what is incorrect or missing
4. Show evidence from code, specifications, execution results, or other sources
5. Explain a more appropriate way to think about the issue
6. Present the smallest necessary implementation example or fix
7. End with one confirmation question that helps the owner explain the concept in their own words

Do not merely say that something is "correct" or "wrong." Explain which assumptions lead through which causal relationships to the conclusion.

### 1.4 Do Not Reveal the Answer First

When asking for a hypothesis, do not provide:

* Completed code
* The API name that would be the correct answer
* A definitive cause
* Leading hints that effectively reveal the answer
* A patch or diff
* Detailed steps
* Choices that contain the answer

However, it is allowed to organize facts, target files, and reproduction conditions needed to think about the problem.

### 1.5 Exceptions

The Hypothesis-First Protocol may be skipped in the following cases:

* The owner explicitly says to skip the hypothesis phase
* The task is mechanical and involves almost no technical judgment, such as renaming files, formatting, or fixing typos
* An urgent issue is discovered, such as a security incident, data loss, or secret leakage
* The owner has already provided a hypothesis and reasoning
* The environment is non-interactive, such as CI, and it is not possible to wait for a human response

When applying an exception, state the reason for skipping in one sentence at the beginning of the response.

---

## 2. Hypotheses in GitHub Code Reviews

In non-interactive GitHub code reviews, Codex may not be able to wait for the owner's response.

Therefore, PR descriptions or review request comments are expected to include the following information in principle:

* Purpose of the change
* Chosen design
* Reason for choosing that design
* Areas considered most likely to break
* Impact on the Server/Client boundary
* Impact on rendering or caching
* Points the author cannot judge yet

If this information is missing, ask the author to add their hypothesis before posting a detailed answer when possible.

However, if any of the following serious issues are found, point them out immediately regardless of whether a hypothesis exists:

* Security vulnerability
* Secret leakage
* Data loss
* Missing authentication or authorization
* Bug likely to cause a production incident
* Backward-incompatible change
* Destructive operation that is difficult to recover from

---

## 3. Project Purpose

This project uses a personal technical blog as the subject for learning Next.js.

Rather than increasing the number of blog features, the project emphasizes understanding the following concepts through implementation and comparative experiments:

* App Router
* Server Components
* Client Components
* Server/Client boundary
* Static rendering
* Dynamic rendering
* Streaming
* Suspense
* Data fetching
* Caching
* Revalidation
* Route Handlers
* Server Actions
* Dynamic Routes
* Layout
* Metadata
* Error handling
* Authentication
* Authorization
* Responsibility separation between Next.js and NestJS
* Testing
* Accessibility
* Performance

Implementations must not become mere copies of tutorials.

For each feature, record the hypothesis, options, chosen reason, and observed results.

---

## 4. Intended Architecture

### 4.1 Next.js

Next.js is mainly responsible for:

* Public blog UI
* Admin UI
* Routing
* Layouts
* Display-oriented data fetching with Server Components
* Browser interactions with Client Components
* Loading UI
* Error UI
* Metadata
* OGP
* Sitemap
* RSS
* Entry points for form submission
* Connecting to the NestJS API
* BFF logic only when necessary
* Caching and revalidation

### 4.2 NestJS

After NestJS is introduced, it is mainly responsible for:

* Creating, reading, updating, and deleting articles
* Input validation
* Authentication
* Authorization
* State transitions such as published, draft, and unpublished
* Business rules
* Database access
* API contracts
* Server-side logging
* Exception handling

### 4.3 Responsibility Separation

Do not duplicate the same business logic in both Next.js and NestJS.

Use Next.js Route Handlers only when there is a clear reason, such as:

* Handling HttpOnly cookies
* Hiding authentication information from the browser
* Aggregating multiple APIs for a screen
* Transforming external API responses for a screen
* Providing HTTP endpoints that must exist on the Next.js side, such as webhooks or RSS

Do not add Route Handlers merely because "putting an API layer in between looks cleaner."

---

## 5. Development Policy

### 5.1 Check Before Making Changes

Before changing code, check the following:

* Purpose of the target feature
* Current implementation
* Related tests
* Related types
* Whether it is a Server Component or Client Component
* Where data is fetched
* Impact on caching
* Impact on authentication and authorization
* Impact on the NestJS API
* Existing design decisions

Even when something is unclear, do not immediately start large changes based on guesses.

### 5.2 Change Size

Do not pack too many unknown technical elements into a single change.

Examples of desirable change units:

* Article list using fixed data
* Fetching articles from NestJS
* Adding Loading UI
* Adding Error UI
* Article creation API
* Article creation form
* Revalidation after publishing
* Authentication
* Authorization

Separate refactoring and feature additions as much as possible.

### 5.3 Dependencies

Before adding a new production dependency, always explain the following and ask for approval:

* Problem to solve
* Why standard features are insufficient
* Candidate packages
* Advantages of the candidate
* Maintenance cost
* Alternatives

Do not add a new dependency when the problem can be solved with existing packages.

### 5.4 Scope

Do not perform large refactors that were not requested.

Keep changes to the minimum scope necessary to solve the problem.

If another issue is found nearby, do not expand the scope without permission. Report it separately.

### 5.5 Git Commit Messages

When Codex creates commits in this repository, use Conventional Commits.

Examples:

* `feat: add article detail page`
* `fix: revalidate article detail after publish`
* `docs: record cache strategy decision`
* `test: add routing coverage for not found pages`

Choose the type from the actual purpose of the change, such as `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, or `style`.

---

## 6. Next.js Implementation Rules

### 6.1 Prefer Server Components

Keep components as Server Components by default.

Use Client Components only when one of the following is needed:

* React state
* Event handlers
* Effects
* Browser APIs
* Client-only libraries
* UI that changes in response to user interaction

When adding `use client`, explain why it is necessary.

Before turning a large component into a Client Component, consider whether only the interactive part can be separated into a small Client Component.

### 6.2 Data Fetching

Fetch public data as close as possible to where it is used, in a Server Component or server-side function.

Do not fetch data in `useEffect` after mount when the browser does not need to fetch that data.

When choosing a data fetching method, explicitly state:

* Where it runs
* When it runs
* Whether it requires authentication information
* Whether it is cached
* Under what conditions it is revalidated
* What is shown when an error occurs

### 6.3 Caching

Do not treat caching implicitly.

For implementations that use or invalidate cache, explain:

* What is cached
* Why it is cached
* How stale the data may be allowed to become
* What triggers invalidation
* What should be displayed immediately after an update

After creating, updating, publishing, unpublishing, or deleting an article, check for missed revalidation of affected lists, detail pages, tag pages, and similar pages.

### 6.4 Authentication and Authorization

Do not treat hiding elements on the screen as authorization.

Do not make Proxy, Middleware, Layout, or Client Component screen control the final authorization boundary.

Validate permission to read or modify data on the server side, close to the data or processing.

After NestJS is introduced, authorization should generally also be enforced on the NestJS side.

### 6.5 Secrets

Do not pass secrets, access tokens, internal API keys, or private URLs to Client Components.

When using environment variables, confirm that their values are not included in the browser bundle.

### 6.6 Errors and Loading

When adding data fetching, consider not only the successful case but also:

* Loading
* Data not found
* API failure
* Expired authentication
* Missing permission
* Invalid input
* Timeout
* Partial data fetch failure

Do not swallow errors by replacing them with empty arrays or `null`.

---

## 7. Comparative Experiments for Learning

For important design decisions, do not present only one option. Compare two or more options when possible.

Examples:

* Server Component fetching vs Client Component fetching
* Static rendering vs dynamic rendering
* Cached vs uncached
* Server Action vs Route Handler
* Direct calls from Next.js to NestJS vs using a BFF
* URL-based state management vs client-internal state management
* Optimistic updates vs updates after server responses

When comparing options, cover at least the following perspectives:

* Execution location
* Network requests
* Initial HTML
* JavaScript amount
* Security
* Caching
* Error handling
* Testability
* Complexity
* Practical maintainability

Do not leave unnecessary implementations in production code solely for comparison. Use experiment branches, tests, or documentation when needed.

---

## 8. Documentation and ADRs

When making important design decisions, add or update an ADR under `docs/adr/` as needed.

An ADR should include:

* Context
* Problem
* Options
* Chosen option
* Reason for the choice
* Downsides
* Conditions for reconsideration

The following decisions are ADR candidates:

* Adopting App Router
* Data fetching location
* Server/Client boundary
* Responsibility separation with NestJS
* Authentication method
* API client generation method
* Cache strategy
* Monorepo structure
* Introducing a state management library

Do not redundantly duplicate facts in documentation when they can already be read from the code.

---

## 9. Testing and Verification

### 9.1 Commands

Determine the package manager from the lockfile.

Do not guess and run scripts that do not exist. Check `package.json` first.

After changes, run the following as far as available:

1. Tests directly related to the changed area
2. Type check
3. Lint
4. Build
5. Necessary E2E tests

If not all checks can be run, explicitly state which checks were not run and why.

### 9.2 Testing Policy

Tests should verify user-visible behavior or public contracts, not implementation details.

Main E2E targets:

* Public article list can be viewed
* Article detail can be viewed
* Nonexistent articles return 404
* User can log in
* Article can be created
* Draft can be published
* Published article appears on the public side
* Unauthorized users cannot perform admin operations

When fixing a bug, add a test that reproduces the bug first whenever possible.

---

## 10. Code Review Rules

In code reviews, report concrete issues before summaries.

Do not focus reviews on mere preferences, minor naming issues, or problems that formatters can detect.

### 10.1 Issues to Prioritize

Prioritize checking for:

* Real bugs
* Security issues
* Missing authentication or authorization
* Secret leakage
* Data loss
* Broken API contracts
* Missing cache invalidation
* Incorrect Server/Client boundary
* Unnecessary `use client`
* Secret references from Client Components
* Inappropriate direct access from the browser to internal APIs
* Business logic duplicated between Next.js and NestJS
* Missing error handling
* Race conditions
* Invalid state transitions
* N+1 requests
* Clear performance regressions
* Serious accessibility regressions
* Missing important tests

### 10.2 Next.js-Specific Checklist

Check whether:

* Logic that can be handled by Server Components has been unnecessarily moved to Client Components
* Client Component boundaries have spread higher than necessary
* Non-serializable values are passed across the Server/Client boundary
* Data fetching has moved to the browser unnecessarily
* Required paths or tags are revalidated after updates
* Static and dynamic data are confused
* `loading`, `error`, and `not-found` states are considered
* Metadata depends on user-specific secret information
* Redirects are executed at an appropriate layer
* Authorization does not rely only on screen control

### 10.3 NestJS Integration Checklist

Check whether:

* Business logic is duplicated on the Next.js side
* Input is validated on the NestJS side
* Authorization is enforced on the NestJS side
* API errors are properly transformed or displayed
* API response types match frontend assumptions
* Status code meanings are appropriate
* Timeouts and communication failures are handled
* Tokens or personal information are not logged

### 10.4 Review Comment Format

Each finding should include as much of the following as possible:

* Severity
* Target file and line
* Conditions that cause the problem
* Actual result
* Evidence that it is a problem
* Minimal fix direction

For findings based on assumptions, do not state them as facts. Explain what should be checked to determine whether the issue is real.

Example:

```text
[P1] Article detail cache is not invalidated after publishing

This process revalidates only the article list.
Users who have already viewed the article detail may continue seeing the old body.

Please confirm that the detail page for the target slug is also revalidated after publishing.
```

### 10.5 What Not to Do in Reviews

* Do not state issues as facts without clear evidence
* Do not demand broad refactors unrelated to the diff
* Do not force preferences as "best practices"
* Do not list large numbers of issues that formatters or lint can detect automatically
* Do not invent findings when there are no real issues
* Do not modify code during review unless the owner explicitly asks for it
* Do not claim code works if tests were not run
* Do not report verification as completed when it was not run

### 10.6 When No Issues Are Found

If no serious or concrete issues are found, clearly state that.

Do not create findings unnecessarily.

In that case, also briefly state:

* Scope reviewed
* Tests run
* Scope not verified
* Remaining risks

---

## 11. Self-Review After Codex Implementation

When Codex changes code, review its own diff before reporting completion.

At minimum, check:

* Whether the requested goal is satisfied
* Whether out-of-scope changes are included
* Whether the Server/Client boundary is appropriate
* Whether secrets are not leaked to the client
* Whether caching and revalidation are consistent
* Whether error states are handled
* Whether tests are insufficient
* Whether existing API contracts are not broken
* Whether documentation updates are needed
* Whether unnecessary dependencies were added

If a problem is found during self-review, report it instead of hiding it.

---

## 12. Completion Report

For work involving implementation, the completion report must include:

* What changed
* Chosen design
* Reason for the choice
* Comparison with the owner's hypothesis
* Changed files
* Tests and commands run
* Verification that could not be run
* Remaining risks
* What the owner should confirm in their own words next

Do not paste large amounts of code as a substitute for explanation.

---

## 13. Definition of Done

Work is complete when:

* The requested behavior is implemented
* The owner's hypothesis has been considered
* The design reason has been explained
* Related tests have been added or updated
* Available type checks, lint, tests, and build have been run
* Verification that could not be run has been reported
* The Server/Client boundary can be explained
* The data fetching location can be explained
* The cache and revalidation policy can be explained
* Responsibilities are not duplicated between Next.js and NestJS
* Important design changes are recorded in ADRs when needed
* The owner can explain the implementation in their own words

Prioritize understanding over speed.

However, do not justify overengineering, unnecessary abstractions, or purposeless technology adoption in the name of "learning."
