# Phase 6 evaluation — 17 October 2026

This records the current evidence and remaining work. It is not a WCAG conformance declaration. The implementation starts from `afe7219`; user messaging remains deferred until its refactor.

## What is checked

The isolated browser tests exercise the real client, route loaders, forms and styles against synthetic API responses. They do not authenticate against MongoDB or prove backend behavior. The new journeys use keyboard activation and typing; locating a control and focusing it in a test does not replace a complete manual Tab-order or screen-reader check.

| Journey or failure | Evidence |
| --- | --- |
| Find a book/movie, fail sign-in, retry and return to the item | `journeys.spec.ts`; exposed and fixed loss of the original return page after a failed login |
| Create a review, save the item, visit the wishlist, reopen it, use Back/Forward, sign out | `journeys.spec.ts`, for both books and movies |
| Accept a friend request, visit the new friend, return, send another request after a failure | `journeys.spec.ts` |
| Missing item returned as HTTP 404 | `recovery.spec.ts`; uses the existing missing-item heading and catalog link |
| Failed sign-out and retry, desktop and mobile | `recovery.spec.ts`; one persistent error, useful focus and keyboard dismissal |
| Slow sign-out while switching to mobile navigation | `recovery.spec.ts`; both controls share pending state and send one request |
| Failed root/auth, book/movie catalog/detail, profile and user-review loads | `recovery.spec.ts`; approved error screen, one main/heading, error title, keyboard retry at the same URL and restored title/focus |
| Lost connection, slow/failed retry, duplicate activation and leaving recovery | `recovery.spec.ts`; loader-only retries, persistent feedback, narrow-screen actions/home link and preserved header focus when the user moves away |
| Slow/failed review saves, lost connection, expired session, retry, preserved draft | Existing `forms.spec.ts`; the draft remains in the mounted form, not across navigation or reload |
| Slow results, stale responses, failed likes/saves/friend requests, toast timing | Existing navigation, action, content and notification suites |

The existing CI workflow already runs these new test files automatically. No additional workflow or credentials are needed. Every new axe baseline is empty: no new accessibility violations are accepted.

## Validation results

On Windows with Node 22.15.0, Playwright 1.64.0 and axe 4.13.0:

- The final full Chromium suite passed **213 tests**, with no failures, skips or retries/flaky results. This includes **19 new Phase 6 tests**. All **57** baseline files contain `[]`; baseline updates were disabled. Retry checks also verify that a successful recovery never announces another failure.
- All **28** unit tests passed. Typechecking, linting, the production build and `git diff --check` passed.
- The production build retained Vite's bundle-size advisory; no build failure occurred. CI configuration is unchanged and includes the new specs automatically.

The temporary local client/API processes started for the smoke check were stopped afterwards. No environment configuration, schema or migration was changed.

## Public website and local API

On 17 October at 15:44 UTC, the public home page at [beyond-reviews-smoc.onrender.com](https://beyond-reviews-smoc.onrender.com/) loaded in Chrome 155 on Windows. It used asset `index-CDwRRxmv.js`, retained the title “Beyond Reviews”, and had no `main`, `h1`, or skip link. Those differ from the current checkout. This is a smoke check of the public home page, not a deployed-build accessibility pass. No public-account writes or deployment were performed.

The local client on 5173 and API on 8080 were initially stopped. Both were started for a separate real-API smoke check in Chrome 155 on Windows:

- The first supplied test account signed in through the form; the second authenticated through the local API. Both received authenticated sessions and successfully signed out. The second account's sign-out also updated the app header back to Login.
- The real movie catalog and detail loaded. Adding/removing a saved movie confirmed both states; its original unsaved state was restored.
- The real book catalog/detail, profile, friends and wishlist loaded. Opening and cancelling an existing book review restored focus to Edit without saving.
- Axe 4.13.0 reported no violations or incomplete checks in six settled states: movie detail, book catalog, book detail after Cancel, profile, friends and wishlist. These are smoke checks of selected states, not full route/state or screen-reader evaluation.

No reviews or friend relationships were changed. The saved-item selection was restored; authentication created and ended local sessions. Credentials and session tokens are not stored in repository files. A browser-tool zoom shortcut did not change the viewport/zoom, so it supplies no evidence of native zoom support. Full native zoom, session-expiry/re-authentication, password-manager and Google sign-in checks remain pending. The automated suite uses its separate, isolated client on 5174.

## Still to finish

| Work | Next step |
| --- | --- |
| Recovery screen | Approved and implemented. Verify spoken error/retry feedback and focus with a real screen reader and on the released build. Root/auth failures deliberately omit the header until its data is available. |
| Accessibility statement | Completed as [repository documentation](accessibility-statement.md), including the owner's confirmed feedback email. The owner chose documentation only; there is no new app page/footer link and no deployment/publication claim. |
| Screen-reader evaluation | Run the journeys below with NVDA and Chrome or Firefox on Windows. Record versions, speech, focus, route and result. No screen-reader run is claimed here. VoiceOver/Safari is an additional useful check where available. |
| Zoom, enlargement, contrast themes and targets | Check native 200% text enlargement and 400% desktop browser zoom, including 1280-to-320 CSS-pixel reflow. Check keyboard focus against the sticky header and notification overlay, all control states, forced-color themes and target spacing. Viewport and doubled-font automation is supporting evidence. |
| Authentication integration | Both accounts passed a local authentication smoke check. Still verify complete form journeys for both, a password manager, password paste, Google sign-in and return, expired sessions and retry. Keep an unsaved review open while signing in again in another tab; confirm it can be saved afterwards. Copy the draft before leaving its page. |
| Release verification | After the owner deploys this PR, rerun the journeys against that build. Record the deployed revision, date and browser/assistive-technology versions. |
| Remaining known requirements | Visible registration requirements remain unresolved under the current appearance constraint. Review language handling for non-English user content. Messaging findings remain open/deferred, not passed or not applicable. |

## Manual journeys to run

Use Tab/Shift+Tab to move between controls, Enter/Space to activate, arrow keys for ratings and tabs, and Escape to close the mobile menu. Run each journey without a mouse, then with a screen reader. Record actual results in the [manual evaluation record](accessibility-testing.md#manual-evaluation-record), including any failure and how to reproduce it.

1. **Sign in and recover:** open a media detail, enter incorrect credentials, dismiss the error, correct them, and confirm the app returns to the same item. Check that labels, errors and loading status are spoken once.
2. **Find and review:** search, apply/remove a filter, open a result, select a rating and save a review. Edit it, test Cancel, then fail a save using the browser's offline mode. Check that the draft and focus remain useful, restore the connection and retry.
3. **Saved items:** add/remove an item, verify the pressed state, visit the wishlist, switch media tabs and reopen an item. Test a failed request and use Back/Forward.
4. **Friends:** fail and retry sending a request, accept a received request, verify the destination of focus when Accept disappears, open the friend's profile and return.
5. **Failures and sign-out:** test missing items, a slow request, sign-out failure and retry. Also fail root, catalog and detail loads and use both recovery actions. Check focus after dismissing an error, especially when a failed mobile sign-out closes its menu. Essential error information should remain available until dismissed or retried.

For every journey, also check a narrow/landscape screen, large text and native browser zoom. Record what actually passed; do not infer screen-reader speech or whole-client conformance from axe results. WCAG requires evaluation of [full pages and complete processes](https://www.w3.org/TR/WCAG22/#conformance-reqs).
