# Client accessibility plan: WCAG 2.2 AA

Updated: 13 October 2026. Based on the code review and local browser checks at `79a1499`.

The goal is to make the client easier to use with a keyboard, screen reader, enlarged text, and small screens, and to meet the applicable WCAG 2.2 Level A and AA requirements.

This plan covers the client except **user messaging**, which will be addressed after its planned refactor. Friend requests, profiles, and other social features remain in scope. Shared component fixes may also help messaging, but messaging-specific fixes and tests are deferred.

Full-client WCAG 2.2 AA conformance remains pending while messaging has unresolved issues. Excluding it from this round of work does not make those issues pass or become “not applicable.” See the [W3C conformance requirements](https://www.w3.org/TR/WCAG22/#conformance-reqs).

The [detailed audit](accessibility-audit.md) contains the findings, affected files, browser evidence, test-data changes, contrast measurements, and full WCAG checklist. This document explains what to do and in what order.

## How to use this plan

Implement the current scope in **one pull request**. The six phases below are the order of work within that PR. Use separate commits for related changes so the work is easier to review.

Test each phase on the pages it affects as you go. Before merging the PR, run the combined automated checks and complete the manual journey testing in Phase 6. Include a checklist of completed phases, test results, and any remaining limitations in the PR description.

You do not need to finish a large testing setup before fixing urgent problems. Messaging-specific work remains deferred until after its refactor and is outside this PR.

Fix the review bugs early: **Cancel currently saves a review**, and a failed review edit can **lose the draft without showing an error**. These fixes are described in Phase 3 and can be brought forward.

No database changes are expected for this work.

## Phase 1 — Set up checks

**Implemented on 13 October 2026:** browser checks, synthetic account/data fixtures, reviewed failure baselines, non-watch test commands, CI configuration, and a findings/manual-testing checklist. See [how to run the checks and track remaining work](accessibility-testing.md). This completes the testing setup; the UI fixes and final accessibility evaluation remain in later phases.

**Purpose:** Make problems easier to reproduce and catch them when the app changes.

- Set up repeatable test accounts and data for empty and populated pages, saved items, reviews, friend requests, and locked/unlocked recommendations.
- Add automated checks for common accessibility problems on representative pages.
- Keep a short checklist of known problems, their fixes, and what still needs manual testing.
- Make these checks run alongside the existing project checks.

**Done when:** Checks can run on both logged-out and logged-in pages using loaded app content. Known failures are recorded, and new failures are caught.

Developer reference: use Playwright with axe for browser checks and the existing component-test tools where useful. Use isolated test data or mocked responses. Automated checks support manual testing; they cannot prove WCAG conformance.

## Phase 2 — Make navigation easier

**Purpose:** Help people move around the app and understand where they are.

- Make the mobile menu work with the keyboard: focus enters it, stays inside while open, Escape closes it, and focus returns to the menu button.
- Add a “Skip to main content” link and clearly identify the main content and navigation areas.
- Give each page a meaningful title and main heading.
- Make keyboard focus easy to see. After changing pages, place focus somewhere useful; keep it on the control when changing a filter, tab, or page of results.

**Done when:** A keyboard user can open and close the menu, bypass the header, identify the current page, and continue without losing their place.

Developer reference: findings A01, A06, and A13. Improve shared buttons and links here so later fixes can reuse them.

## Phase 3 — Make forms and review saving reliable

**Purpose:** Help people understand what to enter, correct mistakes, and keep their work.

- Give search and form fields clear labels and instructions. Connect error messages to the affected fields and announce failures.
- Make login and registration work with password managers and pasted credentials. Show password and upload requirements before submission.
- Make the 1–10 rating a clearly named choice with a selected value that keyboard and screen-reader users can understand.
- Fix review Cancel so it never saves. Validate before saving, keep the form and draft during requests, show save errors, and preserve useful focus.

**Done when:** People can complete forms, correct errors, select a rating, cancel an edit, and retry a failed save without losing their draft or place.

Developer reference: findings A02–A05. Use native radio inputs for ratings, make button types explicit, and connect the existing review validation to submission. Messaging inputs and sending are deferred.

## Phase 4 — Explain selections and action results

**Purpose:** Make it clear what is selected and whether an action worked.

- Make tabs, likes, saved-item buttons, filters, and pagination expose their current state to screen readers and show it beyond color alone.
- Provide understandable loading, success, and error feedback for reviews, likes, saved items, and friend requests. Report success only when it is justified by the request result.
- Keep focus useful when an action removes its button, such as accepting a friend request.
- Give image links and icon controls clear names, fix list structure, and make expanded content and recommendation rows usable with the keyboard.

**Done when:** People can tell what is selected, understand an action's outcome, and continue using the page without unexpected focus loss.

Developer reference: findings A07, A10, and A12, plus recommendation focus checks in A13. Preserve existing toast announcements and avoid announcing the same result twice. Chat selection and message announcements are deferred.

## Phase 5 — Improve readability and small-screen layouts

**Purpose:** Keep content readable and controls usable when the display or text size changes.

- Fix low-contrast text, buttons, selected states, icons, and focus indicators.
- Make forms and cards fit their containers. Let pagination, filters, review actions, and rating choices wrap or adapt.
- Check small screens, enlarged text, browser zoom, longer content, and increased text spacing.
- Check control size and spacing, sticky-header overlap, and scrolling so focused controls stay visible.

**Done when:** Pages in the current scope work at 320 CSS pixels, 200% text enlargement, and 400% browser zoom from a 1280-pixel-wide starting viewport, without losing ordinary content or functions.

Developer reference: findings A08, A09, and A13. Measure actual rendered colors and all interaction states. AA target-size requirements use 24 CSS pixels with defined exceptions; 44 pixels is not the AA minimum. Messaging layout checks are deferred.

## Phase 6 — Test complete journeys and keep checking

**Purpose:** Verify that the fixes work together in normal use and when something goes wrong.

- Test complete journeys with a keyboard and screen reader, including signing in, finding media, writing reviews, saving items, and managing friend requests.
- Test errors, slow requests, missing items, expired sessions, browser Back/Forward, and useful recovery options. Make error pages accessible.
- Finish the WCAG checklist for the current scope and record any remaining gaps. Check the deployed build as well as the local app.
- Keep automated checks running for future changes and publish an accurate accessibility statement that explains the messaging deferral.

**Done when:** The journeys in the current scope pass their applicable automated and manual checks, and the remaining messaging work is clearly recorded.

Developer reference: finding A14 and the [criterion coverage register](accessibility-audit.md#criterion-coverage-register). Use NVDA on Windows and VoiceOver on Apple devices where available. An automated score alone is insufficient.

## What to test in this round

For each journey, include empty/populated, loading, success, and failure states where relevant.

| Area | Main checks |
| --- | --- |
| Shared layout and navigation | Desktop/mobile menu, skip link, headings, page titles, focus after navigation |
| Login, registration, and logout | Invalid fields, credentials, uploads, password-manager use, Google sign-in, expired sessions |
| Book and movie catalogs | Search, filters, sorting, removing filters, empty results, loading more |
| Details and reviews | Rating, create/edit/cancel, failed saves, likes, saved items, pagination, expanded text |
| Recommendations | Locked and available states, arrow controls, offscreen items, keyboard and touch use |
| Profiles and friends | Own/other profiles, sending and accepting requests, failures, focus after a request disappears |
| Wishlist, reviews, and activity | Tabs, empty/populated states, loading/errors, pagination |
| Placeholder and error pages | Music, albums, settings, unknown paths, missing items, unavailable API |

Check keyboard order and visible focus; screen-reader labels, state, and feedback; contrast; small-screen layout; zoom; text enlargement and spacing; touch controls; and recovery from failures.

The audit already contains local browser sampling using the two authorized test accounts. Actual screen-reader testing, complete keyboard traversal, real zoom, and several error states still need evaluation. Use repeatable test data for future checks.

## Deferred — User messaging after its refactor

Do not include messaging-specific fixes or tests in the six phases above. Revisit these issues after the feature is refactored:

- Clear labels for the message input and selected conversation.
- Sending only when a conversation is selected, without silently discarding drafts.
- Useful sending/loading errors, pending state, retry, and draft/focus retention.
- Sender identity, message order, and announcements for new messages.
- Keyboard access to older history and stable reading position while it loads.
- Small-screen and zoom layouts, contrast, list structure, and visible focus.

These are retained findings from the current implementation, especially A11 and the messaging portions of A04, A07, A09, and A12. Reassess the new implementation rather than assuming the old fixes apply unchanged.

## When this round is finished

- The non-messaging findings are fixed or closed with evaluated evidence.
- Applicable WCAG A/AA checks pass for the pages and complete journeys in this round.
- Automated checks and manual keyboard, screen-reader, visual, and layout checks pass.
- The deployed build has been checked, and the accessibility statement accurately describes the evaluated scope and remaining limitations.

**Full-client WCAG 2.2 AA conformance is a later milestone:** after the messaging refactor, fix and test its accessibility, then evaluate complete pages and processes across the whole client before making that claim.
