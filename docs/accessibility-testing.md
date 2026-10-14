# Accessibility checks and remaining work

Updated: 14 October 2026, after Phase 3. This is the testing guide for the [accessibility plan](accessibility-plan.md). It does not claim that the app meets WCAG yet.

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
- Keyboard entry, focus containment, Escape, closing, destination links, resizing, scrolling, and logout in the mobile menu.
- Skip links, page headings/titles, Back/Forward focus, forced-color focus outlines, and focus during search, filters, tabs, and pagination.
- Missing media, the existing user-route error boundary, and review Cancel without a save request.

`pages.spec.ts` contains the original axe scans. `navigation.spec.ts` checks navigation and keyboard behavior. `forms.spec.ts` checks form labels, validation, autofill/paste support, upload errors, review creation/editing, slow saves, failures, retries, and expired sessions; it also scans failed review-save states. Every non-dialog scanned state also requires one main landmark, one main heading, and a page-specific document title. When the modal menu is open, its background is intentionally unavailable to assistive technology.

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

Evidence and affected source files are in the [audit](accessibility-audit.md#prioritized-findings). Phases 2 and 3 implement navigation and form fixes. The client maintainer owns follow-up. Automated results below cover the specified states; screen-reader and final journey evaluation remain pending.

| ID | What needs fixing | Planned phase | Status / retest |
| --- | --- | --- | --- |
| A01 | Mobile-menu keyboard and focus behavior | 2 | Implemented; automated keyboard retest passed 14 October; screen-reader/final journey checks pending |
| A02 | Review Cancel, validation, rating labels and selection | 3, urgent fixes early | Partly implemented: native radio semantics behind the original stars, required rating, create/edit/cancel, and invalid action payloads retested 14 October; a visible selected-value cue beyond color and screen-reader evaluation remain pending |
| A03 | Review draft loss and focus during saves | 3, urgent fixes early | Implemented; slow saves, duplicate prevention, failure/retry, network/session failures, reopening, and focus retested for books/movies 14 October |
| A04 | Search labels | 3 | Search portion implemented and retested 14 October; message-input portion deferred |
| A05 | Authentication labels, errors, instructions, autofill | 3 | Partly implemented: field associations, first-error focus, server errors, clipboard paste, autocomplete tokens, and photo validation retested 14 October; instruction text is screen-reader-only to preserve the UI; visible requirements and actual password-manager/screen-reader evaluation remain pending |
| A06 | Main content, headings, titles, route focus | 2 | Implemented for normal/placeholder/missing-item pages and the existing user error boundary; structural and route-focus checks passed 14 October; screen-reader evaluation pending |
| A07 | Tabs, toggles, and selected filters | 4 | Open; pagination now exposes its current page and unavailable controls; chat-selection portion deferred |
| A08 | Contrast | 5 | Open; contrast baseline and rendered-state retest pending |
| A09 | Narrow layouts, zoom, and text spacing | 5 | Open; original star row, textarea size, form widths, and button spacing restored at the maintainer's request; responsive form changes require an agreed visual design; messaging layout portion deferred |
| A10 | Loading, errors, success feedback, removed-control focus | 4 | Review-saving feedback/focus implemented in Phase 3; other actions and screen-reader announcements remain pending |
| A11 | Message input, sending, history, and announcements | After refactor | Deferred; remains unresolved |
| A12 | Link/image names and list structure | 4 | Profile navigation list and header profile-link name fixed in Phase 2; media/image work remains open; chat-list portion deferred |
| A13 | Visible focus and keyboard access in scrolling areas | 2, 4, 5 | Partly implemented: shared focus outlines, header scroll clearance, scrollable menu, and stable paging focus retested 14 October; full scrolling/zoom checks remain open |
| A14 | Error recovery and timed feedback | 6 | Open; existing user error page has a heading/title; root/catalog error recovery and process/timing evaluation remain pending |

## Phase 1 validation

Local validation on 13 October 2026 used Windows, Node 22.15.0, Playwright 1.64.0, Chromium 156, and axe 4.13.0 against the client at source baseline `79a1499`:

- 37 browser tests passed in normal mode, with baseline updates disabled. They cover 39 scanned states and the regression probe.
- All seven existing component tests passed with the non-watch command.
- Typechecking, linting, and the production build passed.
- The CI guard rejected an attempted baseline update. Documentation links and the 55-criterion checklist were checked.

The GitHub Actions workflow is configured; its first hosted run remains pending a push or PR. The local checks above do not close the known accessibility findings or replace the final manual/deployed evaluation.

## Phase 2 validation

Local validation on 14 October 2026:

- All 70 browser tests passed with baseline updates disabled: the original 37 tests and 33 new navigation/keyboard tests. The original 39 axe scan states remain covered.
- All eight component tests passed, including a regression check that ordinary buttons do not submit forms and explicit submit buttons still do.
- Linting and the production build, including TypeScript checking, passed. Vite still reports the existing advisory about a bundle larger than 500 kB.
- Reviewed all 39 baseline diffs. Changes only remove existing failing elements: 432 recorded rule/element occurrences became 43, and 20 states now have empty failure lists. This counts repeated findings across states, not unique defects or WCAG criteria. No new failing elements were accepted.
- Visually checked the mobile menu and its focused close control in the browser screenshot attached to the keyboard test report.

The mobile menu uses the already installed [Headless UI Dialog](https://headlessui.com/react/dialog). It provides a named modal, background isolation, focus containment, and focus restoration, following the [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/). Menu links close it before destination focus is applied; switching to desktop closes it and focuses visible navigation. Short menus scroll to focused controls.

Route metadata supplies titles. `PageNavigation` moves focus to the destination heading after a pathname change, including browser history, and leaves initial-load focus alone. Query changes, local tabs, and revalidation keep their initiating control. Catalog controls and pagination stay mounted while requests run; paging controls expose unavailable states without discarding focus. Shared buttons, links, tabs, and icon buttons forward native attributes and refs for later phases. The sticky header is currently 6rem high; keep `--header-height` in `index.css` in sync if that changes.

Vite ignores test snapshots and reports so writing them cannot reload a page in the middle of a test. Reports, screenshots, and build output remain untracked.

These are local Chromium checks with synthetic data. Actual screen-reader use, broader contrast/layout/zoom evaluation, root/catalog error recovery, real authentication/backend integration, the deployed build, and the remaining phases still need evaluation. Messaging-specific work remains deferred. No hosted CI result is claimed here.

## Phase 3 validation

Form fields also retain their original focused appearance: the shared white/dark focus ring excludes inputs, selects, and textareas, leaving their existing border styles and native browser focus indicators. Links, buttons, and keyboard-operated rating stars keep their shared focus ring.

Local validation on 14 October 2026:

- All 92 browser tests passed with baseline updates disabled: 22 new form tests plus the previous 70 tests. The suite now scans 41 states.
- All 18 component/action tests passed. The ten new action tests verify that missing, out-of-range, fractional, and invalid ratings never reach the API, for both books and movies.
- TypeScript checking, linting, formatting, and the production build passed. The existing bundle-size advisory remains.
- All original scan states retain the same findings. Four edit/create-form baselines have reordered classes in one axe selector after styling the radios as stars. Added two reviewed baselines for failed book/movie review saves; they contain the same existing A08 contrast findings as the corresponding edit-form states. No unrelated failures were accepted. Axe did not detect the original placeholder-only label, rating-state, and draft-loss problems; dedicated behavior checks now cover them.
- Browser checks exercise real clipboard paste, invalid credentials, duplicate-email and general registration failures, invalid photo types/size, and native radio keyboard selection at 320 CSS pixels. Automated checks confirm error descriptions, invalid states, and status/alert markup; they do not confirm actual screen-reader announcements.
- After restoring the original UI, compared the initial login, registration, search, book-review, and movie-review forms against an isolated copy of `c1d5c32` at 1280 × 900. All five comparisons matched both position/dimensions and screenshot pixels. The reference server used intercepted API fixtures; it did not access real accounts or data. Temporary comparison code was removed afterwards.

The original form appearance is preserved: compact stars with hover preview, textarea dimensions, button spacing and pending text, authentication layouts, and login alert placement. The existing Search heading labels its input without an added label row. Rating semantics use transparent native radios over the original stars; keyboard focus remains visible, and pointer clicks have no outline. Rating instructions/selected-value text, authentication hints, validation summaries, and status announcements are screen-reader-only and do not add rows or spacing. Visible field errors retain their styling; a failed review save also shows an error so users know their draft was not saved.

Review forms validate before submitting and remain mounted while saving. The submit control retains focus and prevents duplicate requests; rating choices and text cannot change during the request. Cancel discards an unsaved draft without posting. Failed requests preserve values for retry. Successful saves wait for loader revalidation, announce completion, return focus to Edit, and allow reopening without stale success data. Each form owns its fetcher, and media-item changes reset the review section.

The root and media-detail routes skip revalidation after a failed review action so an unavailable auth check or expired session cannot remove the draft. Successful saves and unrelated navigation keep the router's normal revalidation behavior. A draft is retained in the mounted form, not saved across navigation or a browser reload; copy it before leaving to sign in again. Full session-expiry recovery remains part of Phase 6.

Search has an associated visible label, validation feedback, and focus returns to its input after clearing the search. Authentication fields expose required/invalid states, related error text, and autocomplete purposes. Server failures use alerts; duplicate registration email errors focus the email field. Password/photo descriptions are available to screen readers; visible requirements before submission remain open. The client photo limit matches the existing server limit of 5 MiB; no backend policy changed.

Preserving the UI leaves some accessibility work unfinished: visible password/photo instructions, a visible rating-selection cue beyond color, and narrow-layout/zoom issues. Screen-reader-only text does not resolve these requirements for sighted users. Actual password-manager autofill, screen-reader operation/announcements, deployed integration, and final journey evaluation also remain pending. Messaging-specific forms and sending remain deferred. No hosted CI result is claimed here.

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

