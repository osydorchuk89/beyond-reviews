# Accessibility checks and remaining work

Updated: 15 October 2026, after Phase 4's nonvisual work, approved error notifications, and restoration of the original selection appearance. This is the testing guide for the [accessibility plan](accessibility-plan.md). It does not claim that the app meets WCAG yet.

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

`actions.spec.ts` checks tab selection, action states, slow/failed requests, retries, duplicate prevention, and focus after friend requests. `content.spec.ts` checks loading more results, review pagination, expanded reviews, and keyboard access to recommendation rows. Wishlist checks also verify that desktop and mobile controls share the same confirmed state, success toasts wait for the response, and leaving/reopening a detail page ignores the previous request. `src/store/wishlist.test.ts` checks request guards, recovery, and isolation between items, media types, accounts, and page visits.

`notifications.spec.ts` checks visible persistent errors, one alert per failure, keyboard dismissal and focus restoration, repeated attempts, independent errors alongside wishlist success, cleanup on retry/navigation, and focus when a response arrives late. It also scans a friend-request failure at desktop/mobile widths. Existing action/content failure checks require visible errors.

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

Evidence and affected source files are in the [audit](accessibility-audit.md#prioritized-findings). Phases 2–5 implement navigation, form, state, feedback, contrast, and responsive fixes. The client maintainer owns follow-up. Automated results below cover the specified states; screen-reader and final journey evaluation remain pending.

| ID | What needs fixing | Planned phase | Status / retest |
| --- | --- | --- | --- |
| A01 | Mobile-menu keyboard and focus behavior | 2 | Implemented; automated keyboard retest passed 14 October; screen-reader/final journey checks pending |
| A02 | Review Cancel, validation, rating labels and selection | 3, 5, urgent fixes early | Code fixes implemented: native radio semantics behind stars, required rating, create/edit/cancel, and invalid payloads. Phase 5 adds approved responsive stars with visible outlines and measured light/dark selection contrast; keyboard and forced-color emulation checks passed 16 October. Actual screen-reader/final visual evaluation remains pending |
| A03 | Review draft loss and focus during saves | 3, urgent fixes early | Implemented; slow saves, duplicate prevention, failure/retry, network/session failures, reopening, and focus retested for books/movies 14 October |
| A04 | Search labels | 3 | Search portion implemented and retested 14 October; message-input portion deferred |
| A05 | Authentication labels, errors, instructions, autofill | 3 | Partly implemented: field associations, first-error focus, server errors, clipboard paste, autocomplete tokens, and photo validation retested 14 October; instruction text is screen-reader-only to preserve the UI; visible requirements and actual password-manager/screen-reader evaluation remain pending |
| A06 | Main content, headings, titles, route focus | 2 | Implemented for normal/placeholder/missing-item pages and the existing user error boundary; structural and route-focus checks passed 14 October; screen-reader evaluation pending |
| A07 | Tabs, toggles, and selected filters | 4, 5 | Code fixes implemented. Approved darker pagination, bookmarks and rating stars supply measured light/dark state distinctions; rejected underline/checkmark stay removed. Tabs/likes retain strong light/dark state differences; filters retain the selected remove control. Keyboard/state checks passed 16 October; manual screen-reader/visual evaluation remains pending; chat-selection portion deferred |
| A08 | Contrast | 5 | Observed failures fixed with approved colors, outlines, hover treatments and stronger selected states. All 47 contrast-node exceptions removed from the 43 baseline states; no new exception added. Targeted rendered-color/hover/forced-color emulation checks passed 16 October. Full manual state/focus evaluation remains pending |
| A09 | Narrow layouts, zoom, and text spacing | 5 | Approved code fixes implemented 16 October: fluid registration, responsive stars, wrapping review actions/pagination/filters, growing card headers/login, fitting recommendation panels and wrapping long names/titles/reviews. Targeted desktop, 320-pixel, doubled-font, long-content and spacing checks passed. Native zoom/text enlargement and final layout evaluation remain pending; messaging portion deferred |
| A10 | Loading, errors, success feedback, removed-control focus | 4 | Code changes implemented and retested 15 October: confirmed success, request guards, hidden pending/success status, approved persistent error toasts, existing loading/success appearance, stale-tab response protection, and focus after acceptance/final load-more. Actual screen-reader announcements and final journey evaluation pending |
| A11 | Message input, sending, history, and announcements | After refactor | Deferred; remains unresolved |
| A12 | Link/image names and list structure | 4 | Non-messaging code fixes implemented: contextual poster/link/action names and catalog/user-review list items retested 15 October; observed list failures removed from baselines; screen-reader/final journey evaluation pending; chat-list portion deferred |
| A13 | Visible focus and keyboard access in scrolling areas | 2, 4, 5 | Partly implemented: Phase 2 focus fixes plus named keyboard-scrollable book/movie/friend recommendations, offscreen focus visibility, and retained arrow focus at limits retested 15 October; full scrolling/zoom/contrast evaluation remains open |
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

At the end of Phase 3, preserving the UI left visible password/photo instructions, rating selection contrast, and narrow-layout/zoom issues unfinished. Phase 5 subsequently implements the approved rating contrast and targeted responsive fixes; visible password/photo requirements remain pending. Screen-reader-only text does not resolve those visible-instruction requirements. Actual password-manager autofill, screen-reader operation/announcements, deployed integration, and final journey evaluation also remain pending. Messaging-specific forms and sending remain deferred. No hosted CI result is claimed here.

## Phase 4 validation

Local validation on 15 October 2026, with the current appearance preserved:

- 120 browser tests passed with baseline updates disabled: the previous 92 and 28 new action/content checks. The 41 axe scan states remain in place.
- All 18 component/action tests passed. TypeScript checking, linting, formatting, and the production build passed. The existing bundle-size advisory remains.
- Eight baselines lost their resolved list-structure exception: anonymous/empty/populated book and movie catalogs, expanded mobile movie filters, and populated user reviews. The populated friends baseline has new selectors for the same two low-contrast buttons after adding contextual names; their contrast failure remains open. No new rule or failing element was accepted.
- Thirty temporary screenshot comparisons against `968af15` matched pixel for pixel. They covered loaded catalogs, book/movie details, wishlist, reviews, activities, friends, and another user's profile at 1280 × 900 and 390 × 844, plus Movies/Albums selections in all three tabbed sections at both widths. Both copies used the same intercepted images/API data. The isolated reference server and temporary comparison code were removed afterwards.

Tabs use Left/Right arrows, Home, and End to move keyboard focus. Enter/Space select the focused tab, so moving between tabs does not start network requests. Each tab controls a shared panel named by the selected tab. The panel has a keyboard entry point even when it is empty or loading. This follows the manual-activation approach in the [W3C tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/). Slow review/activity responses cannot overwrite a newer tab's results or error state.

Likes, wishlist buttons, and filters expose their selected state. Like counts, saved selection, and friend-request confirmation change only after the server request succeeds. The like API now propagates failures so the UI can handle them. Pending requests reject duplicate activation while retaining keyboard focus. Hidden status regions describe pending/completed actions; failures use the approved visible error toasts described below. Existing visible tab errors retain their appearance and now have alert semantics. Wishlist success still uses the existing toast, after confirmation, without a second success announcement. Desktop/mobile bookmarks share state and the request guard through Zustand alongside the existing mobile-menu store. The detail page resets wishlist state when the item or signed-in account changes; late responses cannot overwrite the new selection.

Accepting a friend request leaves the request in place until success. If its button still has focus when the response arrives, focus moves to the next received request or the new friend's link. It does not steal focus after the user has moved elsewhere. When the final Load More button disappears, focus moves to the first newly added result; a failed load retains the existing results and allows retry. Removing a sidebar filter focuses its selection button, and removing a filter tag returns focus to Search.

Catalogs and user-review lists have proper list items. Movie poster links include the title, truncated title links expose the full title, and icon actions have contextual names. Review expansion exposes its expanded state and the controlled text. Recommendation regions are named and keyboard-scrollable; focus reveals offscreen links/buttons, and reaching a scroll limit leaves focus on the arrow. The existing layouts, button/icon styling, hover previews, form styling, and toast appearance are preserved.

**Selection appearance and remaining work:**

The page underline and saved-bookmark checkmark were tried and rolled back at the maintainer's request. Their accessible states and request/focus improvements remain. Phase 5 subsequently implements approved darker pagination/bookmark colors with stronger light/dark state differences; the underline/checkmark remain absent.

After the rollback, all seven focused wishlist/pagination browser checks, typechecking, and lint passed.

The earlier proposal to add markers to every selected control was broader than necessary. [W3C's use-of-color guidance](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) accepts a relative-luminance contrast of at least 3:1 as an additional visual distinction. Browser conversion of the installed palette gives approximately 5.1:1 between selected/unselected tab backgrounds and 3.8:1 between like fills. Selected filters already show a remove control. These controls retain their current appearance; full contrast, hover, forced-color, and manual evaluation remain pending.

**Approved visible error notifications:**

Failed likes, wishlist updates, sending/accepting friend requests, catalog Load More, and media-review pagination now show toasts in the existing light-blue notification style. They have no automatic dismissal timeout and can be closed using the existing dismiss button. Retrying clears that action's error; leaving its page context clears it too. Independent errors remain visible when another action succeeds. The shared notification container is available on catalog, detail, and profile pages. Existing loading indicators, buttons/icons, normal layouts, and wishlist-success appearance remain. No additional loading indicators were introduced.

Each error uses the toast's alert semantics; the duplicate hidden error alert has been removed. Appearance of a notification preserves focus, including when the user has moved elsewhere during a slow request. Keyboard users can use the notification library's existing Alt+T shortcut, Tab to Dismiss, and Enter/Space to close. Closing a focused notification restores the location that was focused when it appeared, if that element is still mounted. These DOM/focus checks do not establish actual NVDA/VoiceOver announcement behavior.

Validation after the approved error changes:

- 125 browser tests passed with baseline updates disabled, including five notification checks and 43 axe scan states. Desktop/mobile error screenshots were visually inspected.
- Both new error-state baselines contain only the existing A08 contrast failure on Back to your profile, matching the existing other-profile baseline. No new toast finding was accepted; previous scan baselines are unchanged by the error-notification work.
- All 18 component/action tests, typechecking, lint, formatting, and the production build passed. The existing bundle-size advisory remains.

Phase 5 supplies the subsequently approved light/dark selection distinctions. Actual NVDA/VoiceOver announcements, full keyboard journeys, native zoom/high-contrast evaluation, deployed/backend integration, and feedback timing/recovery still require manual evaluation. The browser tests verify DOM state, focus, and mocked request outcomes; they do not establish those manual results or WCAG conformance. Messaging-specific changes remain deferred, and no real accounts or local API data were used in these checks.

## Phase 5 preparation

On 16 October 2026, isolated Chromium inspection visited 15 routes: home, login, registration, both catalogs and detail/review forms, populated profile/wishlist/reviews/activities/friends, another user's profile, music, and an unknown path. The initial populated persona redirected login to home; login was subsequently inspected with an anonymous response. API responses and images were synthetic; real accounts and local API data were not used.

The inspection checked three conditions separately: a 320-pixel viewport, a 1280-pixel viewport with text-spacing overrides (1.5 line height, 2em paragraph spacing, .12em letter spacing, .16em word spacing), and a 1280-pixel viewport with computed font sizes doubled. Loading skeletons and loading status were allowed to finish before measurement. Font-size injection is a diagnostic approximation, not native browser text enlargement. Document-width measurements alone do not detect internal clipping, overlapping text, partially hidden carousel content, or obscured focus. No pass or conformance conclusion follows from this inspection.

Confirmed examples before the approved fixes at 320 CSS pixels:

- Registration's 576-pixel form produces a 448-pixel document width and clips content on the left.
- Both detail/review forms produce a 356-pixel document width because their ten 32-pixel rating choices exceed the form's available width.
- Rendered white text on the shared blue button measures 4.02:1; inline Search text measures 3.38:1; review date/count metadata measures 4.20:1. These small-text combinations need 4.5:1.

Two groups were approved and implemented under the instruction to approve UI changes before applying them:

| Group | Proposed change |
| --- | --- |
| Layout | Cap registration at its container width. Let the ten stars share the available width while retaining one row and their normal 32-pixel size where it fits. Reduce review-action spacing on small screens and wrap actions when necessary. Allow pagination to wrap. |
| Contrast | Blue buttons and selected pagination: `sky-700`. Inline Search background: `orange-700`. Review metadata: `gray-600`. Dark close icons: `orange-800`. Query-link hover: `sky-700`. Retain existing darker hover treatments where applicable. |

## Phase 5 validation

The approved fixes cap registration at its container width, share the rating row between ten equal square controls up to 32 pixels each, wrap review actions/pagination, and improve contrast. Small-screen review-action gaps are 12 pixels; desktop horizontal gaps retain 40 pixels. The inline Search hover uses `orange-800` to preserve a darker hover response after its default becomes `orange-700`. Input focus styling, labels, form instructions, and messaging-specific components are unchanged.

`layout.spec.ts` adds 50 browser tests: registration/login and book/movie cards/review forms at normal desktop size, 320 pixels, doubled computed font sizes, and narrow text-spacing overrides; all three recommendation rows at 320, 390 and 768 pixels; book/movie pagination at 320 × 256; and header, catalog-hover and SVG contrast. Checks cover form/control bounds, desktop widths, ten same-row targets of at least 24 × 24 pixels, keyboard selection of all ratings, visible keyboard focus, growing card titles above metadata, Google label/logo separation, fitting recommendation panels with long names, offscreen focused links, wrapping pagination, and focus below the sticky header. SVG measurements check actual rendered stroke width, normal and hover selection contrast, and forced-color emulation. Whole-page contrast analyses include the header. Font-size overrides, forced-color emulation and a reduced viewport do not establish native text enlargement, real browser zoom or actual Windows high-contrast-theme results.

Tablet follow-up: reproduced a 2-pixel overlap between catalog cards at 768 pixels. The results container narrowed to 75% at `md` while the grid switched to two columns; it now stays full width until the sidebar moves alongside it at `lg`. Ten additional geometry checks passed for books and movies at 767, 768, 769, 1024 and 1536 pixels, along with typechecking and lint. These tests bring the configured suite to 194; the full 184-test result below predates this focused follow-up.

`wrapping.spec.ts` adds 18 checks at 320 pixels, with normal and increased text spacing. They cover multiple selected filters, long filter labels, at least 24 × 24-pixel close controls, keyboard filter removal and Search focus, long book/movie detail titles/credits/reviews, both profile review tabs, profile/friend names, and activity titles/reviews. The shared main-content wrapping rule also permits flex/grid content to shrink below a long word's intrinsic width; ordinary short text keeps its existing layout. Filter labels use a readable line height instead of zero, and the existing chip spacing is retained. Shared fixes may incidentally help messaging, but messaging-specific evaluation remains deferred.

Validation on 16 October:

- All 184 browser tests passed in the final combined run with snapshot updating disabled, including 58 new Phase 5 checks. This includes 43 baselined scan states and eight additional contrast analyses.
- All 28 unit tests, typechecking, lint, and the production build passed; the existing bundle-size advisory remains.
- Removed all 47 previously baselined contrast-node exceptions, without adding new ones. All 43 baseline JSON files now contain `[]`; they remain checked in to catch regressions. Empty baselines do not establish WCAG conformance or cover untested layouts/states.
- Actual narrow stars measure approximately 24.8 × 24.8 pixels and remain 32 × 32 on desktop. All ten choices remain in one row and keyboard-operable. Desktop registration remains 576 pixels wide.
- Selected pagination (`sky-700`) versus unselected pagination (`sky-100`) measures 5.09:1. This supplies the additional lightness distinction described by [W3C's Use of Color guidance](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html), without restoring the rejected underline. Forced-color and final visual evaluation remain pending.

The second approved round is implemented:

| Area | Previous issue | Implemented fix |
| --- | --- | --- |
| Header highlight/hover | Orange on dark blue measured 2.60:1. | `orange-200` active/hover text measures 5.52:1. |
| Rating appearance | Selected orange on its review background measured 2.17:1. | Darker selected stars and a thin dark-orange outline: 3.93:1 against the background; selected/unselected fill difference 3.06:1. |
| Saved bookmark | Blue on white measured 2.77:1. | `sky-700` fill/border measures 5.86:1 at rest; `sky-600` saved hover remains at least 3:1 against white and the unsaved hover fill. The icon shape and absence of a checkmark are preserved. |
| Enlarged card titles | A 112-pixel title extended outside its fixed 64-pixel header when fonts were doubled. | The header grows with its content and pushes metadata down; short desktop headers remain 64 pixels tall. |
| Narrow recommendations | A 304-pixel card was shown through a 144-pixel area at a 320-pixel viewport. | A container query moves arrows above the row when its available width is at most 28rem; cards fit that width using container units. Friend cards contain their visually hidden status elements so focusing later cards cannot create page overflow. |
| Enlarged login | The Google link extended to about y=849 while main/footer met at y=816; logo/label could overlap. | The page keeps a minimum height but grows with its content, and the Google link reserves horizontal space for its logo. |

Synthetic-content inspection originally found horizontal overflow at a 320-pixel viewport from multiple selected filters (430-pixel document), unusually long profile names (493), long review/title content (2020), and long detail titles/descriptions (2253). The approved wrapping fixes now keep those documents at 320 pixels. All approved Phase 5 implementation work is complete. Native 200% text enlargement, real 400% browser zoom, and complete manual focus/target-size evaluation remain pending before this phase is fully closed. Messaging-specific work remains deferred.

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

