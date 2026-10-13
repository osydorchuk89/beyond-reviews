# Client accessibility audit: WCAG 2.2 AA

Investigation date: 10 October 2026. Source baseline: `79a1499`.

This file records the investigation behind the [accessibility plan](accessibility-plan.md). The current implementation scope excludes user messaging until its planned refactor. Messaging findings are retained as a deferred backlog; they remain unresolved and must be addressed before claiming full-client conformance.

The long-term goal is to make every client page and complete user workflow meet all applicable WCAG 2.2 Level A and AA criteria. Conformance covers full pages and complete processes, including error states and authentication. Automated checks alone cannot establish conformance. See the [W3C conformance requirements](https://www.w3.org/TR/WCAG22/#conformance-reqs).

This document is audit evidence and developer reference, not a conformance claim. No application source code was changed during the investigation. Authorized test-data changes from the authenticated follow-up are documented below.

## Scope and evidence

Reviewed `AGENTS.md`, both READMEs, client routes, layout, styling, shared controls, authentication forms, media catalogs/details/reviews, recommendations, profiles, wishlist, activity, friends, messaging, API actions/loaders, and test/lint configuration.

The checked-out client already supports books and movies through shared media components. Music, settings, and album content have placeholder states. Include all of these rendered states in scope; reuse shared fixes across media types.

Evidence collected:

- `npm run lint`: passed; Biome checked 127 files. This does not establish accessibility.
- `npm run typecheck`: passed.
- Initial browser checks used actual client components in an isolated Chrome context, with an anonymous root loader substituted in browser memory because the local API was unavailable at that time. On retry, the running client and server were reachable, and the checks below used normal routes and real API responses without substituted loaders. These anonymous passes made no account or media/social data changes; the subsequent authenticated checks used existing test accounts and explicitly authorized test-data changes.
- Live API retry: `GET http://localhost:8080/auth/status`, `GET /api/movies?page=1&limit=2`, and `GET /api/books?page=1&limit=2` all returned HTTP 200. Authentication status was anonymous. The status endpoint also responded through `127.0.0.1`. The normal browser client loaded both catalogs, confirming browser access to the API as well as direct HTTP access.
- Live movies/books catalogs confirmed the generic document title, missing main/page-heading structure, and search input without an associated label. Movie poster links were exposed as “movie poster.”
- Registration at a 320 CSS-pixel viewport rendered a 576-pixel form and a 440-pixel document width. The accessibility tree had no main landmark or level-one heading.
- Opening the mobile menu left focus on its trigger. Escape did not close it. Tabbing through its links reached the registration first-name field while the overlay stayed open.
- Empty registration submission focused the first invalid field and displayed messages, but inputs still had no `aria-invalid` or error descriptions. Preserve the useful existing first-error focus behavior.
- Contrast estimates below use the installed Tailwind palette, converted to 8-bit sRGB in the browser. Recheck rendered elements and interaction states during implementation.
- A Lighthouse mobile snapshot of the normally loaded movie catalog scored 89 for accessibility. Its failed accessibility audits reported insufficient color contrast, invalid list children, and a missing main landmark. This is a supporting baseline for that anonymous page, not a conformance result.
- Registration overflow (576-pixel form, 440-pixel document at a 320-pixel viewport) and mobile-menu focus/Escape failures were reconfirmed on normal routes against the running server.

Authenticated sampling and several mutation success/failure checks are now complete, as detailed below. Actual screen-reader behavior, real browser zoom, remaining error/process states, and the deployed build still need evaluation. The earlier Lighthouse run on the API-error fallback remains excluded from the application baseline. API availability no longer blocks further local evaluation.

Existing strengths to preserve: native buttons/links, labels on authentication fields, decorative SVGs hidden from assistive technology, per-value rating button names, named recommendation arrow buttons, mobile filter disclosure state, English document language, and a viewport declaration that permits zoom.

## Authenticated workflow results

Follow-up performed on 10 October 2026 using the local client/server and two user-provided test accounts in separate browser contexts. The user explicitly approved review, like, wishlist, message, and friend-request changes. Credentials were used only for browser login and are not included in repository artifacts. Account A denotes the first account; account B denotes the second.

Account A initially had 1,146 movie reviews, 80 book reviews, one saved movie, unlocked book/movie/friend recommendations, and no friends or pending requests. Account B initially had no reviews, saved items, friends, or pending requests, with recommendations locked. This allowed both populated and empty/locked states to be inspected without seeding additional reviews into account A.

The checks used normal routes and real API responses. Enter/Space activated focused controls. DOM/accessibility-tree inspection verifies exposed markup and focus, but does not substitute for NVDA/VoiceOver evaluation or prove full keyboard traversal. Review and message failure tests injected a temporary error into the matching browser request only, then restored normal transport. They are simulated transport failures, not real server-side validation failures.

| Workflow | Observed result | Finding/action |
| --- | --- | --- |
| Login/logout | Both accounts signed in successfully through the login form and signed out through header/mobile-menu controls. Authentication status confirmed both sessions were anonymous afterwards. Login moved focus to the body. | Functional success; retain route focus work in A06. Password-manager and OAuth process checks remain pending. |
| Profile, wishlist, reviews, activities, friends, messaging | Authenticated routes loaded for both accounts. They retained the generic title and missing main/level-one heading. Empty, populated, and placeholder states were inspected. | Confirms A06 across authenticated pages. |
| Wishlist/activity/review tabs | Buttons had no tab role or selected state. ArrowRight on focused Books did not navigate tabs. Enter on Movies did load account B's new movie review and retained button focus, but no result status region was present. | Confirms A07; native button activation works, intended tab semantics/behavior remain incomplete. |
| Movie rating and Cancel | Space selected 8/10, then Cancel sent a real review POST returning HTTP 200. The server stored the marked draft as a review. The DOM confirmed Cancel was a submit button. | **Confirmed P0 A02: Cancel saves instead of cancelling.** |
| Movie review edit | Editing the test review to 9/10 succeeded with HTTP 200. The form disappeared during the request and focus moved to the body. | Confirms A03 focus loss even on success. |
| Failed movie review edit | A simulated review POST failure left the server's previous 9/10 review unchanged. The new draft disappeared, the edit form was gone, focus was on the body, and no review error or alert appeared. | **Confirmed P0 A03: silent draft loss on failure.** |
| Book review creation | Keyboard submission saved a marked 7/10 review for account B, returning HTTP 200. Focus again moved to the body. | Functional success; confirms shared review focus issue for books. |
| Rating reflow | On the book detail page at 320 CSS pixels, the ten-star row was 320 pixels wide inside a 233-pixel form; its right edge was at 356 pixels and the document was 374 pixels wide. No fieldset/radiogroup was exposed. | Confirms A02 grouping/state gap and A09 overflow beyond registration. |
| Movie wishlist toggle | Space added the movie and a second activation removed it, both backed by real server state. The control retained focus but had no pressed state. The toast did expose an alert inside the library's notification region. | Confirms A07. Preserve existing toast announcements; do not add duplicate live regions indiscriminately. |
| Book review like toggle | Space changed a review from 13 to 14 likes and added account A's reaction; a second activation restored the original state. Focus stayed on the button, but no pressed state was exposed. | Confirms A07 while verifying functional like/unlike. |
| Recommendations | Account A had populated recommendations; account B's initial locked state was visible. Enter on a recommendation arrow scrolled its row and retained focus. | Preserve working non-drag keyboard action. Item traversal, narrow-layout behavior, and focus clipping still need complete evaluation. |
| Friend request and acceptance | Account B sent account A a request; account A accepted it. Both POSTs returned HTTP 200 and both profiles subsequently had one friend. The accept button disappeared and focus moved to the body; no status region was present. | Confirms removed-control focus gap and missing status mechanism in A10/Phase 4. |
| Message before selecting a conversation | Composer and Send were enabled. Enter cleared the typed draft without making any message POST and without showing an error. | **Confirmed P0 A11: message draft silently discarded.** Deferred until after the messaging refactor: guard no-conversation submission and explain the required selection. |
| Sending and receiving messages | Test messages were stored and visible between the accounts. Sending cleared the input and kept composer focus. The input had no label, the conversation had no log semantics, and no status/live region was exposed. | Functional success; confirms A04/A11 semantics and announcement gaps. Messaging-specific remediation is deferred until after the refactor. |
| Failed message send and retry | A simulated message POST failure preserved the draft and composer focus, but showed no error feedback. Restoring transport and pressing Enter retried successfully, returning HTTP 200. | Deferred until after the messaging refactor: preserve draft/focus retention and add visible/announced failure and pending/retry behavior. |

An authenticated desktop Lighthouse snapshot of account A's wishlist scored 98 for accessibility and reported the missing main landmark. This high score did not identify the observed Cancel, draft-loss, focus, or tab-state problems; use the behavioral results as well as automated scans.

### Test-data changes retained

- Account B has a marked movie review for **Jurassic World Rebirth**, edited to 9/10, and a marked book review for **1984**, rated 7/10. Text begins with `[Accessibility test 2026-10-10]`.
- The accounts are now friends. The request was accepted, so no test request remains pending.
- Their conversation contains three marked test messages: one from A and two from B, including the successful retry.
- Wishlist and like toggles returned to their starting states. Their activity records may still record these actions.
- Account A's review counts stayed at 1,146 movies and 80 books; its existing review text/ratings were not edited. No accounts or existing reviews were deleted. Both browser sessions were logged out.

Still pending: actual assistive-technology output, full Tab/Shift+Tab traversal, real 200% text enlargement/400% zoom, server validation/session-expiry/OAuth errors, duplicate/pending submission behavior, failure rollback for likes/wishlist/friend requests, and complete deployed-process evaluation. Long chat history, reading-position retention, and other messaging-specific checks are deferred until after the refactor. No full WCAG conformance claim follows from this sampling.

## Prioritized findings

P0 = blocks reliable completion of an essential interaction. P1 = required remediation across common pages. P2 = verification or remaining content refinement. These priorities describe delivery order. Messaging work is explicitly deferred at the user's request; its applicable failures remain open. Mixed findings below identify the messaging portions to revisit after the refactor.

| ID | Priority | Evidence and affected code | Proposed outcome | WCAG mapping |
| --- | --- | --- | --- | --- |
| A01 | P0 | [MobileMenuModal](../client/src/components/layout/header/MobileMenuModal.tsx) renders a fixed `div` and backdrop button without modal semantics or focus management. Browser confirmed Escape failure and background focus access. [MobileMenu](../client/src/components/layout/header/MobileMenu.tsx) omits expanded state. | Named modal navigation; focus enters, stays within, closes on Escape, and returns appropriately. Background becomes inert. Trigger exposes state. | 2.1.1, 2.4.3, 4.1.2; verify 2.4.11 |
| A02 | P0 | [MovieReviewForm](../client/src/components/pages/movie/MovieReviewForm.tsx), lines 55–85: label targets misspelled `ratng`; hidden input cannot provide an operable rating group; ten buttons lack selected state. Form submission bypasses the configured form validation. Browser testing confirmed Cancel is a submit button and actually stores the review. | Labeled native radio group for 1–10, selected value announced, keyboard selection, visible current value, validation before submission, and Cancel that never submits. | 1.3.1, 1.4.1, 2.1.1, 3.3.1–3.3.3, 4.1.2 |
| A03 | P0 | [MovieAdditionalInfo](../client/src/components/pages/movie/MovieAdditionalInfo.tsx) and [BookAdditionalInfo](../client/src/components/pages/book/BookAdditionalInfo.tsx), lines 23–27: any pending fetcher replaces the entire form/details with a spinner. Browser testing confirmed body focus after successful saves and draft loss without feedback after a simulated failed edit. | Keep review controls and draft mounted during their own request; retain logical focus and display/announce failures. Restore focus on deliberate edit/display transitions. | 2.4.3, 3.3.1, 4.1.3 |
| A04 | P1; messaging deferred | [SearchBar](../client/src/components/pages/movies/SearchBar.tsx), lines 49–56, has a placeholder-only input. The same issue in [ChatMessageForm](../client/src/components/pages/user/messages/ChatMessageForm.tsx), lines 22–27, is deferred until after the messaging refactor. | Add a persistent visible search label tied to its input and understandable validation feedback. Revisit the message input after the refactor. | 1.3.1, 3.3.1, 3.3.2; verify 2.5.3, 4.1.2 |
| A05 | P1 | [LoginForm](../client/src/components/pages/login/LoginForm.tsx), [RegistrationForm](../client/src/components/pages/registration/RegistrationForm.tsx), and [LoginErrorAlert](../client/src/components/pages/login/LoginErrorAlert.tsx): errors have no programmatic association/announcement; personal-information fields have no autocomplete tokens. Password/upload requirements appear only after failure. | Associate field errors and instructions; expose invalid state; announce server failures; provide requirements in advance and meaningful autofill purposes. | 1.3.5, 3.3.1–3.3.3, 4.1.3; verify 3.3.8 |
| A06 | P1 | [MainLayout](../client/src/components/MainLayout.tsx) has no main landmark or skip mechanism. Desktop [Header](../client/src/components/layout/header/Header.tsx) links are an unlabelled list. Visual page titles in hero, catalogs, auth, media detail, and user reviews are paragraphs. [index.html](../client/index.html) provides one generic title; [ScrollToTop](../client/src/components/ScrollToTop.tsx) changes scrolling only. | Main landmark, skip link, named navigation, meaningful headings, route-specific document titles, and a deliberate route focus/announcement policy. | 1.3.1, 2.4.1–2.4.3, 2.4.6 |
| A07 | P1 | [BaseTab](../client/src/components/ui/BaseTab.tsx) exposes selection by color only. Wishlist/activity/reviews use it. [BookMarkIcon](../client/src/components/icons/BookMarkIcon.tsx) and [LikeIcon](../client/src/components/icons/LikeIcon.tsx) have names but no pressed state. Filter selection also lacks state. Chat selection has the same issue but is deferred until after the messaging refactor. | Proper tabs and panels, toggle pressed state, contextual action names, and visible selection cues beyond color. | 1.4.1, 2.1.1, 4.1.2 |
| A08 | P1 | Palette measurements identify insufficient text contrast in [buttonStyles](../client/src/styles/buttonStyles.ts), [Pagination](../client/src/components/ui/Pagination.tsx), [QueryLink](../client/src/components/ui/QueryLink.tsx), review metadata, and close icons on selected filter chips. | Accessible foreground/background pairs for normal, hover, selected, error, and authored focus states. Measure actual components. | 1.4.3, 1.4.11 |
| A09 | P1 | Registration has fixed `w-[36rem]`; media/friend cards use `w-76`; pagination and filter chips do not wrap. Ten rating stars need 320 pixels before surrounding padding. Messaging combines fixed heights with `overflow-hidden`; that part is deferred until after the messaging refactor. Registration and rating overflow are browser-confirmed; other layout risks require measurement. | Fluid forms/cards, wrapping controls, usable rating layout, and no lost content/functions at narrow widths, zoom, or increased text spacing. | 1.4.4, 1.4.10, 1.4.12 |
| A10 | P1 | [LoadingSpinner](../client/src/components/ui/LoadingSpinner.tsx) and other spinners have no loading text/status. Load-more, review likes, bookmarks, and friend requests log several failures only to console. Bookmark toast reports success before its request completes. | Persistent status/error patterns with appropriate live announcements, truthful success, retry where useful, and preserved user input. | 4.1.3; 3.3.1 for submission errors |
| A11 | Deferred until after messaging refactor; originally P0 | [ChatHistory](../client/src/components/pages/user/messages/ChatHistory.tsx) exposes older history only through scrolling and lacks conversation log semantics. [ChatHistoryMessage](../client/src/components/pages/user/messages/ChatHistoryMessage.tsx) conveys sender through placement/color. Browser testing confirmed Send clears a draft without sending when no conversation is selected, and failed sends preserve drafts but show no feedback. | Guard submission until a conversation is selected; preserve drafts; show pending/error feedback; named, keyboard-usable history; explicit older-message control; sender identity in text; new messages announced without replaying history. | 1.3.1, 1.4.1, 2.1.1, 3.3.1, 3.3.2, 4.1.3 |
| A12 | P1 | Movie poster-only links have generic `alt="movie poster"` in [MovieCard](../client/src/components/pages/movies/MovieCard.tsx) and [MovieReviewDetails](../client/src/components/pages/user/reviews/MovieReviewDetails.tsx). User header link shows initials only. Catalog lists, profile links, and user review cards include children without list-item wrappers. Chat-button list markup is also affected but deferred until after the messaging refactor. | Clear link purpose and contextual image names; decorative images remain empty-alt; correct list structure. | 1.1.1, 1.3.1, 2.4.4 |
| A13 | P2 | Header is sticky and 96 pixels high; [MediaReviews](../client/src/components/pages/media/MediaReviews.tsx) scroll offset is 80. Recommendation rows hide scrollbars. Shared controls have no explicit focus-visible design, although browser defaults may still provide visible focus. | Verify every keyboard target stays visible, including within scrollers; retain focus indicators and ensure authored indicators have contrast. Fix clipping/obscuration found in rendered states. | 2.1.1, 2.4.7, 2.4.11 |
| A14 | P2 | [routes](../client/src/routes.ts) places a custom error boundary only under users. Missing root API renders the router's default application error. Toasts disappear after three seconds. | Accessible root/catalog/detail error recovery and route titles; assess timed feedback and preserve essential information long enough to use it. | 2.4.2, 2.4.3, 2.2.1 where applicable, 4.1.3 |

### Contrast baseline

For text, target at least 4.5:1, or 3:1 for qualifying large text. For required visual control information, evaluate 3:1 against adjacent colors. Disabled controls and decorative graphics have relevant exceptions. See [text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

| Existing pair | Approximate ratio | Where to investigate |
| --- | --- | --- |
| White on sky-600 | 4.02:1 | Normal-size shared sky buttons |
| White on sky-500 | 2.71:1 | Selected pagination page |
| Sky-500 on sky-100 | 2.35:1 | QueryLink hover |
| Orange-50 on orange-600 | 3.37:1 | Small inline search button |
| Gray-500 on sky-100 | 4.21:1 | Small review date/like metadata |
| Orange-600 on orange-300 | 2.10:1 | Close icon on selected filter/search chips |

## Criterion coverage register


The [WCAG 2.2 quick reference](https://www.w3.org/WAI/WCAG22/quickref/) defines the target checklist. The groups below enumerate all 55 A/AA criteria so lower-frequency requirements are not forgotten. Every group remains **pending final evaluation**, including groups with good static evidence. During Phase 1 of the plan, split these into individual criterion/route results. Evaluate current work outside user messaging first. Keep messaging failures recorded as open/deferred, and complete their evaluation after the refactor before making any full-client conformance claim.

| Criteria | Evaluation focus | Main phases |
| --- | --- | --- |
| 1.1.1 | Image meaning, decorative graphics, image/control/link names | 2, 4 |
| 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5 | No audio/video player found in reviewed client components; confirm rendered/third-party content before recording non-applicability | 6 |
| 1.3.1, 1.3.2, 1.3.3 | Headings, lists, labels, grouping, meaningful DOM order, instructions that do not depend on shape/position alone | 2–5 |
| 1.3.4, 1.3.5 | Both orientations; machine-readable purposes of personal-information fields | 3, 5 |
| 1.4.1, 1.4.2 | State/message identity beyond color; check whether any audio starts automatically | 4–6 |
| 1.4.3, 1.4.4, 1.4.5 | Text contrast, enlargement, images containing essential text; distinguish posters/artwork from UI text | 4, 5 |
| 1.4.10, 1.4.11, 1.4.12, 1.4.13 | Reflow, control contrast, text spacing, any hover/focus-triggered supplemental content | 2, 4, 5 |
| 2.1.1, 2.1.2, 2.1.4 | Keyboard operation/escape; no character shortcuts found, confirm none in integrations | 2–6 |
| 2.2.1, 2.2.2, 2.3.1 | Session/notification timing, prolonged animation, flashing content; inspect failure/loading states and assets | 5, 6 |
| 2.4.1, 2.4.2, 2.4.3, 2.4.4 | Bypass, page identification, focus order, link purpose | 2–5 |
| 2.4.5, 2.4.6, 2.4.7, 2.4.11 | Multiple ways to locate pages where required, meaningful labels, visible/unobscured focus | 2, 4–6 |
| 2.5.1, 2.5.2, 2.5.3, 2.5.4 | Pointer gestures/cancellation, visible label in accessible name, any motion activation | 2–6 |
| 2.5.7, 2.5.8 | Alternatives to dragging and target size/spacing; existing scroll arrows are useful evidence, not complete verification | 4, 5 |
| 3.1.1, 3.1.2 | English root language is present; identify known language changes in content when applicable, including user reviews | 4, 6 |
| 3.2.1, 3.2.2, 3.2.3, 3.2.4, 3.2.6 | Predictable focus/input behavior, consistent navigation/control identity/help placement | 2–6 |
| 3.3.1, 3.3.2, 3.3.3, 3.3.4 | Errors/instructions/corrections and applicable stored-data error prevention | 3, 4, 6 |
| 3.3.7, 3.3.8 | Repeated entry within one process; usable authentication with password managers/paste and third-party return | 3, 6 |
| 4.1.2, 4.1.3 | Correct control semantics/state and perceivable asynchronous status | 2–5 |

WCAG 2.2 removes 4.1.1 from its conformance checklist. Still correct invalid markup where it harms semantics. Do not treat AAA criteria such as 2.4.13 or the 44-pixel enhanced target criterion as mandatory AA requirements. The [W3C overview of 2.2 changes](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/) explains the additions and removal.
