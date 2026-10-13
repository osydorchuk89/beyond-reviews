# Accessibility checks and remaining work

Phase 1 setup: 13 October 2026. This is the testing guide for the [accessibility plan](accessibility-plan.md). It does not claim that the app meets WCAG yet.

## Run the checks

From the repository root:

```powershell
npm --prefix client ci
npm --prefix client exec playwright install chromium
npm --prefix client run test:run
npm --prefix client run test:a11y
```

The browser suite starts its own Vite server on **127.0.0.1:5174** and stops it afterwards. Leave that port free. Your existing client on 5173 and API on 8080 can stay running; neither is used by these tests. On Linux, install browser system dependencies with `npx playwright install --with-deps chromium` from `client/`.

`npm --prefix client run test:a11y:report` opens the report. It contains full axe results, including items needing human review. Failed tests also retain screenshots and browser traces. Generated reports are ignored by Git.

`npm --prefix client run lint`, `typecheck`, and `build` remain the usual project checks. The new GitHub Actions workflow runs them, the non-watch component tests, and the browser suite on client/accessibility PRs. CI uploads the browser report and results, requires no secrets or database, and cannot update baselines.

## Repeatable test accounts and data

These are synthetic personas supplied through intercepted API responses, not accounts in MongoDB:

| Persona | State |
| --- | --- |
| Anonymous | Logged out; catalogs, authentication forms, and shared navigation |
| Empty: Sam Newcomer | Logged in; no reviews, saved items, or friends; recommendations locked |
| Populated: Alex Reader | Logged in; three book and movie reviews, saved book/movie, friend, received/sent requests, recommendations available |

Every test gets a fresh browser context and mock API. Real route loaders, components, styles, and validation still run. Fixed dates and local image responses keep the results repeatable. Unexpected API requests or external requests are blocked and fail the test; they never fall through to a real backend. Unexpected browser JavaScript errors also fail the test.

Use `api.respond(method, path, { status, body })` to add a response for an error or interaction before triggering it. Existing fixtures cover reads; mutations must be explicitly mocked before testing them. This is frontend evaluation, so real authentication, OAuth, backend validation, and deployed integration still need separate checks in Phase 6.

## What the suite checks

- Home, login, registration, music placeholder, and unknown routes.
- Loaded book/movie catalogs, empty search results, and expanded mobile filters.
- Validation messages, a failed login request, registration at 320 pixels, and the open mobile menu.
- Empty/populated profiles, wishlist, reviews, activity, friends, and settings.
- Book/movie review creation and edit forms, locked/available recommendations, switched wishlist tabs, and failed review-tab loads.
- A regression probe that adds an unlabeled input and confirms that a new defect is detected.

Tests wait for the expected content or error before scanning. They fail on an unexpected application crash rather than treating its error screen as a successful page scan.

Axe scans WCAG A/AA tags through 2.2, plus best-practice structure checks such as main landmarks and headings. Best-practice rules are useful signals; they are not each a separate WCAG requirement. The suite follows [Playwright's accessibility testing guidance](https://playwright.dev/docs/accessibility-testing). Biome's existing recommended rules already include accessibility rules; no second linter was added.

**Messaging-specific pages, fixtures, and tests are deferred until after its refactor.** A profile's link to Messages may appear as part of the shared UI, but the suite never opens a conversation or sends messages.

## Known failures and baselines

The JSON files in [the baseline directory](../client/tests/accessibility/baselines) record currently observed failures for each scanned state. Each entry contains a rule, audit finding IDs, exact affected selectors, and failing check IDs. No whole component or rule is excluded from scanning.

Normal runs compare against these reviewed files. A new rule, affected element, or failing check fails the test. A resolved failure also changes the baseline, prompting removal of its exception. Missing baseline files fail instead of being created automatically. Full HTML and browser details are kept in reports rather than snapshots.

When fixing an issue:

1. Run the affected checks and inspect the report.
2. Confirm that changed results reflect the intended fix. Investigate new or unmapped rules.
3. From `client/`, run `npm run test:a11y:baseline` to regenerate the baselines. To update only selected tests, use `npx playwright test --update-snapshots=all --grep "test name"`.
4. Review the JSON diff. Remove resolved failures; do not accept unrelated new failures just to make checks pass.
5. Update the finding and manual-evaluation records below, then run `npm run test:a11y` normally.

Changed selectors can change a fingerprint without changing the defect. Review those differences too. A passing baseline means the checked states have no changes in detectable failures; it does not mean they are accessible. Keyboard behavior, focus, zoom, screen-reader announcements, and many other criteria need manual checks.

## Short findings checklist

Evidence and affected source files are in the [audit](accessibility-audit.md#prioritized-findings). The initial findings remain open; Phase 1 adds checks and does not fix the UI. The client maintainer owns follow-up. Record the retest date and evidence when closing an item.

| ID | What needs fixing | Planned phase | Status / retest |
| --- | --- | --- | --- |
| A01 | Mobile-menu keyboard and focus behavior | 2 | Open; behavioral retest pending |
| A02 | Review Cancel, validation, rating labels and selection | 3, urgent fixes early | Open; behavioral retest pending |
| A03 | Review draft loss and focus during saves | 3, urgent fixes early | Open; success/failure retest pending |
| A04 | Search labels | 3 | Open; message-input portion deferred |
| A05 | Authentication labels, errors, instructions, autofill | 3 | Open; password-manager and screen-reader retest pending |
| A06 | Main content, headings, titles, route focus | 2 | Open; structural baseline and manual retest pending |
| A07 | Tabs, toggles, and selected filters | 4 | Open; chat-selection portion deferred |
| A08 | Contrast | 5 | Open; contrast baseline and rendered-state retest pending |
| A09 | Narrow layouts, zoom, and text spacing | 5 | Open; messaging layout portion deferred |
| A10 | Loading, errors, success feedback, removed-control focus | 4 | Open; announcements and failures retest pending |
| A11 | Message input, sending, history, and announcements | After refactor | Deferred; remains unresolved |
| A12 | Link/image names and list structure | 4 | Open; chat-list portion deferred |
| A13 | Visible focus and keyboard access in scrolling areas | 2, 4, 5 | Open; full keyboard/zoom retest pending |
| A14 | Error recovery and timed feedback | 6 | Open; process/timing retest pending |

## Phase 1 validation

Local validation on 13 October 2026 used Windows, Node 22.15.0, Playwright 1.64.0, Chromium 156, and axe 4.13.0 against the client at source baseline `79a1499`:

- 37 browser tests passed in normal mode, with baseline updates disabled. They cover 39 scanned states and the regression probe.
- All seven existing component tests passed with the non-watch command.
- Typechecking, linting, and the production build passed.
- The CI guard rejected an attempted baseline update. Documentation links and the 55-criterion checklist were checked.

The GitHub Actions workflow is configured; its first hosted run remains pending a push or PR. The local checks above do not close the known accessibility findings or replace the final manual/deployed evaluation.

## Manual evaluation record

Use the [plan's journey table](accessibility-plan.md#what-to-test-in-this-round) to select routes and states. Record one result per criterion and route/state: **pass**, **fail**, **not applicable**, or **not yet tested**. Explain every not-applicable decision. Leave unresolved messaging findings deferred, not passed or not applicable.

For each completed check, record:

| Criterion | Route and state | Result | Reproduction / evidence | Browser and assistive technology | Tester and date |
| --- | --- | --- | --- | --- | --- |
| Example: 2.4.3 | Mobile menu open | Not yet tested | Check entry, containment, Escape, return focus | Record versions during evaluation | Unassigned |

The individual criterion checklist below starts as **not yet tested for final evaluation**. Earlier audit evidence and automated baselines do not close a criterion across all applicable routes. Recheck the deployed build before a conformance claim.

| Criterion | Requirement | Final evaluation status |
| --- | --- | --- |
| 1.1.1 | Non-text Content | Not yet tested |
| 1.2.1 | Audio-only and Video-only (Prerecorded) | Not yet tested |
| 1.2.2 | Captions (Prerecorded) | Not yet tested |
| 1.2.3 | Audio Description or Media Alternative (Prerecorded) | Not yet tested |
| 1.2.4 | Captions (Live) | Not yet tested |
| 1.2.5 | Audio Description (Prerecorded) | Not yet tested |
| 1.3.1 | Info and Relationships | Not yet tested |
| 1.3.2 | Meaningful Sequence | Not yet tested |
| 1.3.3 | Sensory Characteristics | Not yet tested |
| 1.3.4 | Orientation | Not yet tested |
| 1.3.5 | Identify Input Purpose | Not yet tested |
| 1.4.1 | Use of Color | Not yet tested |
| 1.4.2 | Audio Control | Not yet tested |
| 1.4.3 | Contrast (Minimum) | Not yet tested |
| 1.4.4 | Resize Text | Not yet tested |
| 1.4.5 | Images of Text | Not yet tested |
| 1.4.10 | Reflow | Not yet tested |
| 1.4.11 | Non-text Contrast | Not yet tested |
| 1.4.12 | Text Spacing | Not yet tested |
| 1.4.13 | Content on Hover or Focus | Not yet tested |
| 2.1.1 | Keyboard | Not yet tested |
| 2.1.2 | No Keyboard Trap | Not yet tested |
| 2.1.4 | Character Key Shortcuts | Not yet tested |
| 2.2.1 | Timing Adjustable | Not yet tested |
| 2.2.2 | Pause, Stop, Hide | Not yet tested |
| 2.3.1 | Three Flashes or Below Threshold | Not yet tested |
| 2.4.1 | Bypass Blocks | Not yet tested |
| 2.4.2 | Page Titled | Not yet tested |
| 2.4.3 | Focus Order | Not yet tested |
| 2.4.4 | Link Purpose (In Context) | Not yet tested |
| 2.4.5 | Multiple Ways | Not yet tested |
| 2.4.6 | Headings and Labels | Not yet tested |
| 2.4.7 | Focus Visible | Not yet tested |
| 2.4.11 | Focus Not Obscured (Minimum) | Not yet tested |
| 2.5.1 | Pointer Gestures | Not yet tested |
| 2.5.2 | Pointer Cancellation | Not yet tested |
| 2.5.3 | Label in Name | Not yet tested |
| 2.5.4 | Motion Actuation | Not yet tested |
| 2.5.7 | Dragging Movements | Not yet tested |
| 2.5.8 | Target Size (Minimum) | Not yet tested |
| 3.1.1 | Language of Page | Not yet tested |
| 3.1.2 | Language of Parts | Not yet tested |
| 3.2.1 | On Focus | Not yet tested |
| 3.2.2 | On Input | Not yet tested |
| 3.2.3 | Consistent Navigation | Not yet tested |
| 3.2.4 | Consistent Identification | Not yet tested |
| 3.2.6 | Consistent Help | Not yet tested |
| 3.3.1 | Error Identification | Not yet tested |
| 3.3.2 | Labels or Instructions | Not yet tested |
| 3.3.3 | Error Suggestion | Not yet tested |
| 3.3.4 | Error Prevention (Legal, Financial, Data) | Not yet tested |
| 3.3.7 | Redundant Entry | Not yet tested |
| 3.3.8 | Accessible Authentication (Minimum) | Not yet tested |
| 4.1.2 | Name, Role, Value | Not yet tested |
| 4.1.3 | Status Messages | Not yet tested |

