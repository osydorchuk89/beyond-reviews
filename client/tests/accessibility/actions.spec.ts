import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import {
    books,
    movies,
    bookReviews,
    movieReviews,
    paginated,
    users,
} from "./data";

// Hold a request without a timing-dependent timeout; the usual isolated API fixture
// still supplies its response and records the request after release.
async function holdRequest(page: Page, method: string, path: string) {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
        release = resolve;
    });
    const bodies: unknown[] = [];
    await page.route(
        (url) => url.pathname.replace(/\/$/, "") === path,
        async (route) => {
            if (route.request().method() !== method) return route.fallback();
            bodies.push(route.request().postDataJSON());
            await gate;
            await route.fallback();
        },
    );
    return { bodies, release };
}

test.describe("Action results", () => {
    test.use({ persona: "empty" });

    for (const media of ["books", "movies"] as const) {
        const item = media === "books" ? books[0] : movies[0];
        const review = media === "books" ? bookReviews[0] : movieReviews[0];
        const path = `/api/${media}/${item.id}/reviews/${review.id}`;

        test(`${media} likes expose confirmed state, prevent duplicates, and retain focus`, async ({
            page,
            api,
        }) => {
            api.respond("PUT", path, { body: {} });
            await page.goto(`/${media}/${item.id}`);
            const like = page.getByRole("button", {
                name: "Like review by Alex Reader",
                exact: true,
            });
            await expect(like).toHaveAttribute("aria-pressed", "false");
            const held = await holdRequest(page, "PUT", path);
            await like.press("Enter");
            await expect(like).toHaveAttribute("aria-busy", "true");
            await expect(like).toHaveAttribute("aria-pressed", "false");
            await expect(
                page.getByText("1 like", { exact: true }),
            ).toBeVisible();
            await like.press("Enter");
            expect(held.bodies).toEqual([
                { like: true, userId: users.empty.id },
            ]);
            held.release();
            await expect(like).toHaveAttribute("aria-pressed", "true");
            await expect(like).toHaveAttribute("aria-busy", "false");
            await expect(like).toBeFocused();
            await expect(
                page.getByText("2 likes", { exact: true }),
            ).toBeVisible();
            await expect(
                page
                    .getByRole("status")
                    .filter({ hasText: "Liked Alex Reader's review." }),
            ).toHaveCount(1);
            await expect(like.locator("svg")).toHaveClass(/fill-sky-600/);
            await like.hover();
            await expect(like.locator("svg")).toHaveClass(/fill-sky-50/);
            await like.press("Space");
            await expect(like).toHaveAttribute("aria-pressed", "false");
            await expect(like.locator("svg")).toHaveClass(/fill-sky-50/);
            await expect(
                page.getByText("1 like", { exact: true }),
            ).toBeVisible();
            expect(held.bodies[1]).toEqual({
                like: false,
                userId: users.empty.id,
            });
        });

        test(`${media} failed likes keep the count and selection and allow retry`, async ({
            page,
            api,
        }) => {
            api.respond("PUT", path, {
                status: 500,
                body: { message: "Fixture failure" },
            });
            await page.goto(`/${media}/${item.id}`);
            const like = page.getByRole("button", {
                name: "Like review by Alex Reader",
                exact: true,
            });
            await like.press("Enter");
            await expect(
                page
                    .getByRole("alert")
                    .filter({ hasText: "Could not update your like" }),
            ).toBeVisible();
            await expect(like).toHaveAttribute("aria-pressed", "false");
            await expect(
                page.getByText("1 like", { exact: true }),
            ).toBeVisible();
            await expect(like).toBeFocused();
            api.respond("PUT", path, { body: {} });
            await like.press("Enter");
            await expect(like).toHaveAttribute("aria-pressed", "true");
            await expect(
                page
                    .getByRole("alert")
                    .filter({ hasText: "Could not update your like" }),
            ).toHaveCount(0);
        });
    }
});

test.describe("Wishlist results", () => {
    test.use({ persona: "populated", viewport: { width: 1280, height: 900 } });

    test("leaving and reopening a detail page ignores the previous wishlist response", async ({
        page,
        api,
    }) => {
        const path = `/api/books/${books[0].id}`;
        api.respond("PUT", path, { body: {} });
        await page.goto(`/books/${books[0].id}`);
        const bookmark = page.getByRole("button", {
            name: `Save ${books[0].title} to wishlist`,
            exact: true,
        });
        const held = await holdRequest(page, "PUT", path);
        await bookmark.press("Enter");
        await expect(bookmark).toHaveAttribute("aria-busy", "true");

        await page
            .getByRole("navigation", {
                name: "Primary navigation",
                exact: true,
            })
            .locator('a[href="/movies"]')
            .click();
        await page
            .locator(`main a[href="/movies/${movies[0].id}"]`)
            .first()
            .click();
        await expect(
            page.getByRole("button", {
                name: `Save ${movies[0].title} to wishlist`,
                exact: true,
            }),
        ).toHaveAttribute("aria-pressed", "true");

        await page.goBack();
        await page.goBack();
        await expect(bookmark).toHaveAttribute("aria-busy", "false");
        await expect(bookmark).toHaveAttribute("aria-pressed", "true");
        const response = page.waitForResponse(
            (response) =>
                new URL(response.url()).pathname === path &&
                response.request().method() === "PUT",
        );
        held.release();
        await (await response).finished();
        await page.evaluate(
            () =>
                new Promise<void>((resolve) =>
                    requestAnimationFrame(() => resolve()),
                ),
        );
        await expect(bookmark).toHaveAttribute("aria-pressed", "true");
        await expect(
            page.getByText("Book was removed from your wishlist", {
                exact: true,
            }),
        ).toHaveCount(0);

        await bookmark.press("Enter");
        await expect(bookmark).toHaveAttribute("aria-pressed", "false");
        expect(held.bodies).toEqual([
            { saved: false, userId: users.populated.id },
            { saved: false, userId: users.populated.id },
        ]);
    });

    for (const media of ["books", "movies"] as const) {
        const item = media === "books" ? books[0] : movies[0];
        const label = media === "books" ? "Book" : "Movie";
        const path = `/api/${media}/${item.id}`;

        test(`${media} saves are confirmed before the toast and shared between desktop and mobile`, async ({
            page,
            api,
        }) => {
            api.respond("PUT", path, { body: {} });
            await page.goto(`/${media}/${item.id}`);
            const bookmark = page.getByRole("button", {
                name: `Save ${item.title} to wishlist`,
                exact: true,
            });
            await expect(bookmark).toHaveAttribute("aria-pressed", "true");
            const held = await holdRequest(page, "PUT", path);
            await bookmark.press("Enter");
            await expect(bookmark).toHaveAttribute("aria-busy", "true");
            await expect(bookmark).toHaveAttribute("aria-pressed", "true");
            await bookmark.press("Enter");
            await expect(
                page.getByText(`${label} was removed from your wishlist`, {
                    exact: true,
                }),
            ).toHaveCount(0);
            await page.setViewportSize({ width: 390, height: 844 });
            await expect(bookmark).toHaveAttribute("aria-busy", "true");
            await bookmark.press("Enter");
            expect(held.bodies).toEqual([
                { saved: false, userId: users.populated.id },
            ]);
            held.release();
            await expect(bookmark).toHaveAttribute("aria-pressed", "false");
            await expect(
                page.getByText(`${label} was removed from your wishlist`, {
                    exact: true,
                }),
            ).toBeVisible();
            await expect(
                page
                    .getByRole("status")
                    .filter({ hasText: "Updating wishlist" }),
            ).toHaveCount(0);
            await page.setViewportSize({ width: 1280, height: 900 });
            await expect(bookmark).toHaveAttribute("aria-pressed", "false");
        });

        test(`${media} failed saves keep selection and focus, without a success toast`, async ({
            page,
            api,
        }) => {
            api.respond("PUT", path, {
                status: 500,
                body: { message: "Fixture failure" },
            });
            await page.goto(`/${media}/${item.id}`);
            const bookmark = page.getByRole("button", {
                name: `Save ${item.title} to wishlist`,
                exact: true,
            });
            await bookmark.press("Enter");
            await expect(
                page
                    .getByRole("alert")
                    .filter({ hasText: "Could not update your wishlist" }),
            ).toBeVisible();
            await expect(bookmark).toHaveAttribute("aria-pressed", "true");
            await expect(bookmark).toBeFocused();
            await expect(
                page.getByText(`${label} was removed from your wishlist`, {
                    exact: true,
                }),
            ).toHaveCount(0);
            api.respond("PUT", path, { body: {} });
            await bookmark.press("Enter");
            await expect(bookmark).toHaveAttribute("aria-pressed", "false");
            await expect(bookmark).toBeFocused();
            await expect(
                page.getByText(`${label} was removed from your wishlist`, {
                    exact: true,
                }),
            ).toBeVisible();
        });
    }
});

test.describe("Tabs and result feedback", () => {
    test.use({ persona: "populated" });

    for (const section of ["wishlist", "reviews", "activities"]) {
        test(`${section} tabs support manual keyboard selection and named panels`, async ({
            page,
            api,
        }) => {
            await page.goto(`/users/${users.populated.id}/${section}`);
            const tabs = page.getByRole("tablist");
            const booksTab = tabs.getByRole("tab", {
                name: "Books",
                exact: true,
            });
            const moviesTab = tabs.getByRole("tab", {
                name: "Movies",
                exact: true,
            });
            const albumsTab = tabs.getByRole("tab", {
                name: "Albums",
                exact: true,
            });
            await expect(booksTab).toHaveAttribute("aria-selected", "true");
            await expect(
                page.getByRole("tabpanel", { name: "Books", exact: true }),
            ).toBeVisible();
            await booksTab.focus();
            const requestCount = api.requests.length;
            await booksTab.press("ArrowRight");
            await expect(moviesTab).toBeFocused();
            await expect(booksTab).toHaveAttribute("aria-selected", "true");
            expect(api.requests.length).toBe(requestCount);
            await moviesTab.press("End");
            await expect(albumsTab).toBeFocused();
            await albumsTab.press("ArrowRight");
            await expect(booksTab).toBeFocused();
            await booksTab.press("Home");
            await booksTab.press("ArrowLeft");
            await expect(albumsTab).toBeFocused();
            await albumsTab.press("Space");
            await expect(albumsTab).toHaveAttribute("aria-selected", "true");
            await expect(
                page.getByRole("tabpanel", { name: "Albums", exact: true }),
            ).toBeVisible();
            await expect(albumsTab).toBeFocused();
            await page.keyboard.press("Tab");
            await expect(
                page.getByRole("tabpanel", { name: "Albums", exact: true }),
            ).toBeFocused();
            await page.keyboard.press("Shift+Tab");
            await expect(albumsTab).toBeFocused();
            expect(await tabs.locator('[tabindex="0"]').count()).toBe(1);
        });
    }

    for (const section of ["reviews", "activities"]) {
        const suffix = section === "reviews" ? "movie-reviews" : "activities";
        test(`${section} announce loading and errors, and ignore stale tab responses`, async ({
            page,
            api,
        }) => {
            await page.goto(`/users/${users.populated.id}/${section}`);
            const path = `/api/users/${users.populated.id}/${suffix}`;
            const held = await holdRequest(page, "GET", path);
            api.respond("GET", path, {
                status: 500,
                body: { message: "Fixture failure" },
            });
            const movieTab = page.getByRole("tab", {
                name: "Movies",
                exact: true,
            });
            await movieTab.press("Enter");
            await expect(
                page
                    .getByRole("status")
                    .filter({ hasText: `Loading movies ${section}` }),
            ).toHaveCount(1);
            await expect(page.getByRole("tabpanel")).toHaveAttribute(
                "aria-busy",
                "true",
            );
            await expect(movieTab).toBeFocused();
            held.release();
            await expect(
                page
                    .getByRole("alert")
                    .filter({ hasText: `Could not load movies ${section}.` }),
            ).toBeVisible();
            await expect(page.getByRole("tabpanel")).toHaveAttribute(
                "aria-busy",
                "false",
            );
            await expect(movieTab).toBeFocused();
            const stale = await holdRequest(page, "GET", path);
            await movieTab.press("Enter");
            await expect(page.getByRole("tabpanel")).toHaveAttribute(
                "aria-busy",
                "true",
            );
            // Reviews/albums resolve locally; activities/books use the API, so
            // allow that newer request through while the movies response is held.
            if (section === "activities") {
                await page.route(
                    (url) =>
                        url.pathname === path &&
                        url.searchParams.get("tab") === "books",
                    (route) =>
                        route.fulfill({
                            json: { ...paginated([]), activities: [] },
                        }),
                );
            }
            const next = page.getByRole("tab", {
                name: section === "reviews" ? "Albums" : "Books",
                exact: true,
            });
            await next.press("Enter");
            await expect(page.getByRole("tabpanel")).toHaveAttribute(
                "aria-busy",
                "false",
            );
            const staleResponse = page.waitForResponse((response) => {
                const url = new URL(response.url());
                return (
                    url.pathname === path &&
                    (section === "reviews" ||
                        url.searchParams.get("tab") === "movies")
                );
            });
            stale.release();
            await (await staleResponse).finished();
            await page.evaluate(
                () =>
                    new Promise<void>((resolve) =>
                        requestAnimationFrame(() => resolve()),
                    ),
            );
            await expect(
                page
                    .getByRole("alert")
                    .filter({ hasText: `Could not load movies ${section}.` }),
            ).toHaveCount(0);
            await expect(next).toHaveAttribute("aria-selected", "true");
            await expect(next).toBeFocused();
        });
    }

    test("filter selection and removals expose state and preserve useful focus", async ({
        page,
    }) => {
        await page.goto("/movies");
        const drama = page
            .locator("aside")
            .getByRole("button", { name: "Drama", exact: true });
        await expect(drama).toHaveAttribute("aria-pressed", "false");
        await drama.press("Enter");
        await expect(drama).toHaveAttribute("aria-pressed", "true");
        await page
            .locator("aside")
            .getByRole("button", { name: "Clear Drama", exact: true })
            .press("Enter");
        await expect(drama).toHaveAttribute("aria-pressed", "false");
        await expect(drama).toBeFocused();
        await drama.press("Enter");
        await page
            .getByRole("button", { name: "Remove Genre: Drama", exact: true })
            .press("Enter");
        await expect(page.getByLabel("Search", { exact: true })).toBeFocused();
        await expect(page).not.toHaveURL(/genre=/);
    });
});

test.describe("Friend requests", () => {
    test.use({ persona: "populated" });
    const sendPath = `/api/users/${users.populated.id}/friend-requests`;
    const acceptPath = `/api/users/${users.populated.id}/friends`;

    test("profile requests wait for success, prevent duplicates, retain focus, and allow failed requests to be retried", async ({
        page,
        api,
    }) => {
        await page.goto(`/users/${users.received.id}/profile`);
        api.respond("POST", sendPath, {
            status: 500,
            body: { message: "Fixture failure" },
        });
        const button = page.getByRole("button", {
            name: "SEND FRIEND REQUEST",
            exact: true,
        });
        const held = await holdRequest(page, "POST", sendPath);
        await button.press("Enter");
        await expect(button).toHaveAttribute("aria-busy", "true");
        await expect(button).toHaveText("SEND FRIEND REQUEST");
        await button.press("Enter");
        expect(held.bodies).toHaveLength(1);
        held.release();
        await expect(
            page
                .getByRole("alert")
                .filter({ hasText: "Could not send the friend request" }),
        ).toBeVisible();
        await expect(button).toBeFocused();
        api.respond("POST", sendPath, { body: {} });
        await button.press("Enter");
        const sent = page.getByRole("button", {
            name: "FRIEND REQUEST SENT",
            exact: true,
        });
        await expect(sent).toHaveAttribute("aria-disabled", "true");
        await expect(sent).toBeFocused();
        await expect(page.getByRole("status")).toContainText(
            "Friend request sent to Casey Requester.",
        );
        await sent.press("Enter");
        expect(held.bodies).toHaveLength(2);
    });

    test("acceptance retains the request on failure and focuses the new friend after confirmed success", async ({
        page,
        api,
    }) => {
        api.respond("POST", acceptPath, {
            status: 500,
            body: { message: "Fixture failure" },
        });
        await page.goto(`/users/${users.populated.id}/friends`);
        const button = page.getByRole("button", {
            name: "Accept friend request from Casey Requester",
            exact: true,
        });
        const held = await holdRequest(page, "POST", acceptPath);
        await button.press("Enter");
        await expect(button).toHaveAttribute("aria-busy", "true");
        await button.press("Enter");
        expect(held.bodies).toHaveLength(1);
        await expect(button).toBeFocused();
        held.release();
        await expect(
            page.getByRole("alert").filter({ hasText: "Could not accept" }),
        ).toBeVisible();
        await expect(button).toBeFocused();
        api.respond("POST", acceptPath, { body: {} });
        await button.press("Enter");
        await expect(button).toHaveCount(0);
        await expect(
            page.locator(`[data-friend-id="${users.received.id}"]`),
        ).toBeFocused();
        await expect(
            page.getByRole("status").filter({
                hasText: "Friend request from Casey Requester accepted.",
            }),
        ).toHaveCount(1);
    });

    test("acceptance moves focus to the next received request", async ({
        page,
        api,
    }) => {
        api.respond("GET", `/api/users/${users.populated.id}`, {
            body: {
                ...users.populated,
                receivedFriendRequests: [
                    ...users.populated.receivedFriendRequests,
                    {
                        ...users.populated.receivedFriendRequests[0],
                        id: "second-request",
                        sentUserId: users.empty.id,
                        sentUser: users.empty,
                    },
                ],
            },
        });
        api.respond("POST", acceptPath, { body: {} });
        await page.goto(`/users/${users.populated.id}/friends`);
        await page
            .getByRole("button", {
                name: "Accept friend request from Casey Requester",
                exact: true,
            })
            .press("Enter");
        await expect(
            page.getByRole("button", {
                name: "Accept friend request from Sam Newcomer",
                exact: true,
            }),
        ).toBeFocused();
    });

    test("acceptance does not steal focus if the user moves away while waiting", async ({
        page,
        api,
    }) => {
        api.respond("POST", acceptPath, { body: {} });
        await page.goto(`/users/${users.populated.id}/friends`);
        const held = await holdRequest(page, "POST", acceptPath);
        const accept = page.getByRole("button", {
            name: "Accept friend request from Casey Requester",
            exact: true,
        });
        await accept.press("Enter");
        await expect(accept).toHaveAttribute("aria-busy", "true");
        const other = page.locator(`[data-friend-id="${users.friend.id}"]`);
        await other.focus();
        held.release();
        await expect(accept).toHaveCount(0);
        await expect(other).toBeFocused();
    });

    test("recommended friend requests retain focus, report failures, and confirm success", async ({
        page,
        api,
    }) => {
        api.respond("POST", sendPath, {
            status: 500,
            body: { message: "Fixture failure" },
        });
        await page.goto(`/users/${users.populated.id}/friends`);
        const button = page.getByRole("button", {
            name: "Add friend: Taylor Reviewer",
            exact: true,
        });
        const held = await holdRequest(page, "POST", sendPath);
        await button.press("Enter");
        await expect(button).toHaveAttribute("aria-busy", "true");
        await button.press("Enter");
        expect(held.bodies).toHaveLength(1);
        await expect(button).toHaveText("Add friend");
        held.release();
        await expect(
            page.getByRole("alert").filter({
                hasText: "Could not send the friend request. Try again.",
            }),
        ).toBeVisible();
        await expect(button).toBeFocused();
        api.respond("POST", sendPath, { body: {} });
        await button.press("Enter");
        const sent = page.getByRole("button", {
            name: "Request sent to Taylor Reviewer",
            exact: true,
        });
        await expect(sent).toHaveAttribute("aria-disabled", "true");
        await expect(sent).toBeFocused();
        await sent.press("Enter");
        expect(held.bodies).toHaveLength(2);
    });

    test("friend recommendations support keyboard scrolling and named arrow controls", async ({
        page,
        api,
    }) => {
        await page.setViewportSize({ width: 900, height: 900 });
        api.respond(
            "GET",
            `/api/users/${users.populated.id}/recommendations/friends`,
            {
                body: {
                    recommendationsAvailable: true,
                    currentReviewCount: 3,
                    minReviewsRequired: 3,
                    recommendations: [
                        users.suggested,
                        users.empty,
                        users.received,
                    ].map((user) => ({
                        user,
                        similarityScore: 0.8,
                        sharedMovieCount: 1,
                        sharedBookCount: 1,
                        sharedFavoriteItems: [],
                    })),
                },
            },
        );
        await page.goto(`/users/${users.populated.id}/friends`);
        const row = page.getByRole("region", {
            name: "Friend recommendations",
            exact: true,
        });
        const right = page.getByRole("button", {
            name: "Scroll friend recommendations right",
            exact: true,
        });
        await expect(row).toBeVisible();
        await expect(right).toHaveAttribute(
            "aria-controls",
            (await row.getAttribute("id")) ?? "",
        );
        await row.focus();
        await row.press("ArrowRight");
        await expect
            .poll(() => row.evaluate((node) => node.scrollLeft))
            .toBeGreaterThan(0);
        await right.focus();
        await row.evaluate((node) =>
            node.scrollTo({ left: node.scrollWidth, behavior: "instant" }),
        );
        await expect(right).toHaveAttribute("aria-disabled", "true");
        await expect(right).toBeFocused();
        await row.evaluate((node) =>
            node.scrollTo({ left: 0, behavior: "instant" }),
        );
        const last = row.getByRole("button", {
            name: "Add friend: Casey Requester",
            exact: true,
        });
        await last.focus();
        const visible = await last.evaluate((node) => {
            const bounds = node.getBoundingClientRect();
            const region = node.closest("section")?.getBoundingClientRect();
            return Boolean(
                region &&
                    bounds.left >= region.left - 1 &&
                    bounds.right <= region.right + 1,
            );
        });
        expect(visible).toBe(true);
    });
});
