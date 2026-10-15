import { test, expect } from "./fixtures";
import { bookReviews, users } from "./data";

test.setTimeout(25_000);

test.describe("Page navigation", () => {
    for (const entry of [
        { path: "/", heading: "Discover, Review, Connect", title: "Home" },
        { path: "/books", heading: "Popular Books", title: "Books" },
        { path: "/movies", heading: "Popular Movies", title: "Movies" },
        {
            path: "/books/book-1",
            heading: "The Quiet Library",
            title: "The Quiet Library",
        },
        {
            path: "/movies/movie-1",
            heading: "The Open Road",
            title: "The Open Road",
        },
        { path: "/login", heading: "Login to your account", title: "Log in" },
        {
            path: "/registration",
            heading: "Register new account",
            title: "Register",
        },
        { path: "/music", heading: "Music", title: "Music" },
        {
            path: "/not-a-route",
            heading: "Page not found",
            title: "Page not found",
        },
    ]) {
        test(`${entry.path} has a heading and page title`, async ({ page }) => {
            await page.goto(entry.path);
            await expect(page.getByRole("main")).toHaveCount(1);
            await expect(page.getByRole("heading", { level: 1 })).toHaveCount(
                1,
            );
            await expect(
                page.getByRole("heading", {
                    level: 1,
                    name: entry.heading,
                    exact: true,
                }),
            ).toBeVisible();
            await expect(page).toHaveTitle(`${entry.title} | Beyond Reviews`);
        });
    }

    test("skip link bypasses the header", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.keyboard.press("Tab");
        const skip = page.getByRole("link", { name: "Skip to main content" });
        await expect(skip).toBeFocused();
        await expect(skip).toBeInViewport();
        await page.keyboard.press("Enter");
        await expect(page.getByRole("main")).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(
            page.getByRole("link", { name: "START BROWSING" }),
        ).toBeFocused();
    });

    test("page navigation and browser history focus the destination", async ({
        page,
    }) => {
        await page.goto("/");
        const books = page
            .getByRole("navigation", { name: "Primary navigation" })
            .getByRole("link", { name: "Books", exact: true });
        await books.focus();
        await page.keyboard.press("Enter");
        await expect(
            page.getByRole("heading", { level: 1, name: "Popular Books" }),
        ).toBeFocused();
        await expect(page).toHaveTitle("Books | Beyond Reviews");
        await page.goBack();
        await expect(
            page.getByRole("heading", {
                level: 1,
                name: "Discover, Review, Connect",
            }),
        ).toBeFocused();
        await expect(page).toHaveTitle("Home | Beyond Reviews");
        await page.goForward();
        await expect(
            page.getByRole("heading", { level: 1, name: "Popular Books" }),
        ).toBeFocused();
    });

    test("movie search keeps its input and scroll position while results load", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/movies");
        await expect(
            page.getByText("The Open Road", { exact: true }),
        ).toBeVisible();
        const input = page.getByLabel("Search", { exact: true });
        await input.fill("Open");
        await page.evaluate(() => window.scrollTo(0, 80));
        const scrollBefore = await page.evaluate(() => window.scrollY);
        let releaseResponse!: () => void;
        const responseReady = new Promise<void>((resolve) => {
            releaseResponse = resolve;
        });
        await page.route("**/api/movies?**", async (route) => {
            if (
                new URL(route.request().url()).searchParams.get("search") ===
                "Open"
            )
                await responseReady;
            await route.fallback();
        });
        const requested = page.waitForRequest(
            (request) =>
                new URL(request.url()).searchParams.get("search") === "Open",
        );
        await input.press("Enter");
        await requested;
        try {
            await expect(input).toBeFocused();
            await expect(
                page.getByRole("heading", { level: 1, name: "Popular Movies" }),
            ).toBeVisible();
        } finally {
            releaseResponse();
        }
        await expect(
            page.getByText('Search: "Open"', { exact: true }),
        ).toBeAttached();
        await expect(
            page.getByText("The Open Road", { exact: true }),
        ).toBeVisible();
        await expect(input).toBeFocused();
        expect(
            Math.abs(
                (await page.evaluate(() => window.scrollY)) - scrollBefore,
            ),
        ).toBeLessThan(5);
    });

    test("keyboard filter changes preserve the initiating control", async ({
        page,
    }) => {
        await page.goto("/movies");
        await expect(
            page.getByText("The Open Road", { exact: true }),
        ).toBeVisible();
        const filter = page
            .locator("aside")
            .getByRole("button", { name: "Drama", exact: true });
        await filter.focus();
        await page.keyboard.press("Enter");
        await expect(page).toHaveURL(/genre=Drama/);
        await expect(
            page.getByText("Genre: Drama", { exact: true }),
        ).toBeAttached();
        await expect(filter).toBeFocused();
    });

    test("focus remains visible in forced colors", async ({ page }) => {
        await page.emulateMedia({ forcedColors: "active" });
        await page.goto("/login");
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        await page.keyboard.press("Tab");
        const skip = page.getByRole("link", { name: "Skip to main content" });
        await expect(skip).toBeFocused();
        const appearance = await skip.evaluate((element) => {
            const style = getComputedStyle(element);
            return {
                width: parseFloat(style.outlineWidth),
                style: style.outlineStyle,
                shadow: style.boxShadow,
            };
        });
        expect(appearance.width).toBeGreaterThanOrEqual(3);
        expect(appearance.style).toBe("solid");
        expect(appearance.shadow).toBe("none");
    });

    for (const mediaType of ["books", "movies"] as const) {
        test(`${mediaType} missing-item page is identified`, async ({
            page,
            api,
        }) => {
            const singular = mediaType === "books" ? "book" : "movie";
            api.respond("GET", `/api/${mediaType}/${singular}-1`, {
                body: null,
            });
            await page.goto(`/${mediaType}/${singular}-1`);
            const heading = `${singular === "book" ? "Book" : "Movie"} not found`;
            await expect(
                page.getByRole("heading", {
                    level: 1,
                    name: heading,
                    exact: true,
                }),
            ).toBeVisible();
            await expect(page).toHaveTitle(`${heading} | Beyond Reviews`);
        });
    }

    test("existing route error boundary has a heading and error title", async ({
        page,
        api,
    }) => {
        api.respond("GET", `/api/users/${users.empty.id}`, {
            status: 500,
            body: { message: "Fixture failure" },
        });
        await page.goto(`/users/${users.empty.id}/profile`);
        await expect(page.getByRole("main")).toHaveCount(1);
        await expect(
            page.getByRole("heading", {
                level: 1,
                name: "Unable to load this page",
            }),
        ).toBeVisible();
        await expect(page).toHaveTitle(
            "Unable to load this page | Beyond Reviews",
        );
    });
});

test.describe("Mobile navigation", () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test("focus enters, cycles inside, and returns on Escape", async ({
        page,
    }, info) => {
        await page.goto("/registration");
        const trigger = page.getByRole("button", {
            name: "Toggle menu",
            includeHidden: true,
        });
        await trigger.focus();
        await page.keyboard.press("Enter");
        const dialog = page.getByRole("dialog", { name: "Navigation menu" });
        await expect(dialog).toHaveAttribute("aria-modal", "true");
        await expect(
            page.getByRole("button", { name: "Close menu", exact: true }),
        ).toBeFocused();
        await expect(page.locator("#root")).toHaveAttribute("inert", "");
        await expect(trigger).toHaveAttribute("aria-expanded", "true");
        await info.attach("mobile-navigation-focus", {
            body: await page.screenshot(),
            contentType: "image/png",
        });
        for (const key of [
            "Shift+Tab",
            "Tab",
            "Tab",
            "Tab",
            "Tab",
            "Tab",
            "Tab",
        ]) {
            await page.keyboard.press(key);
            expect(
                await dialog.evaluate((element) =>
                    element.contains(document.activeElement),
                ),
            ).toBe(true);
        }
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
        await expect(page.locator("#root")).not.toHaveAttribute("inert", "");
    });

    test("close button and backdrop return focus", async ({ page }) => {
        await page.goto("/");
        const trigger = page.getByRole("button", { name: "Toggle menu" });
        await trigger.click();
        await page
            .getByRole("button", { name: "Close menu", exact: true })
            .press("Enter");
        await expect(trigger).toBeFocused();
        await trigger.press("Enter");
        await expect(
            page.getByRole("dialog", { name: "Navigation menu" }),
        ).toBeVisible();
        await page.mouse.click(10, 200);
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(trigger).toBeFocused();
    });

    test("selecting a destination focuses its heading", async ({ page }) => {
        await page.goto("/");
        await page.getByRole("button", { name: "Toggle menu" }).click();
        await page
            .getByRole("dialog")
            .getByRole("link", { name: "Books", exact: true })
            .press("Enter");
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(
            page.getByRole("heading", { level: 1, name: "Popular Books" }),
        ).toBeFocused();
        await expect(page).toHaveTitle("Books | Beyond Reviews");
    });

    test("desktop resize closes the menu and restores visible focus", async ({
        page,
    }) => {
        await page.goto("/registration");
        await page.getByRole("button", { name: "Toggle menu" }).click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.setViewportSize({ width: 1280, height: 800 });
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(
            page
                .getByRole("navigation", { name: "Primary navigation" })
                .getByRole("link", { name: "Books", exact: true }),
        ).toBeFocused();
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(
            page.getByRole("button", { name: "Toggle menu" }),
        ).toHaveAttribute("aria-expanded", "false");
    });
});

test.describe("Authenticated navigation", () => {
    test.use({ persona: "populated" });

    for (const section of [
        "profile",
        "wishlist",
        "reviews",
        "activities",
        "friends",
        "settings",
    ]) {
        test(`${section} identifies the user and section`, async ({ page }) => {
            const label = section[0].toUpperCase() + section.slice(1);
            await page.goto(`/users/${users.populated.id}/${section}`);
            await expect(
                page.getByRole("heading", {
                    level: 1,
                    name: `Alex Reader — ${label}`,
                    exact: true,
                }),
            ).toBeVisible();
            await expect(page).toHaveTitle(
                `${label} — Alex Reader | Beyond Reviews`,
            );
            await expect(
                page.getByRole("link", {
                    name: "Your profile: Alex Reader",
                    exact: true,
                }),
            ).toBeVisible();
        });
    }

    test("tabs preserve keyboard focus", async ({ page }) => {
        await page.goto(`/users/${users.populated.id}/wishlist`);
        const tab = page.getByRole("tab", { name: "Movies", exact: true });
        await tab.focus();
        await page.keyboard.press("Enter");
        await expect(
            page.getByText("The Open Road", { exact: true }).first(),
        ).toBeVisible();
        await expect(tab).toBeFocused();
        await expect(page).toHaveTitle(
            "Wishlist — Alex Reader | Beyond Reviews",
        );
    });

    for (const mediaType of ["books", "movies"] as const) {
        test(`${mediaType} Cancel does not submit`, async ({ page, api }) => {
            await page.goto(
                `/${mediaType}/${mediaType === "books" ? "book" : "movie"}-1`,
            );
            await page
                .getByRole("button", { name: "EDIT YOUR REVIEW", exact: true })
                .click();
            await page
                .getByLabel("Post your review (optional):", { exact: true })
                .fill("Unsaved test draft");
            await page
                .getByRole("button", { name: "CANCEL", exact: true })
                .click();
            await expect(
                page.getByRole("button", {
                    name: "EDIT YOUR REVIEW",
                    exact: true,
                }),
            ).toBeVisible();
            expect(
                api.requests.filter((request) => request.startsWith("POST ")),
            ).toEqual([]);
        });
    }

    test("pagination does not move focus to the page heading", async ({
        page,
        api,
    }) => {
        const path = `/api/users/${users.populated.id}/book-reviews`;
        api.respond("GET", path, {
            body: {
                reviews: [bookReviews[0]],
                currentPage: 1,
                totalPages: 2,
                totalCount: 2,
                hasMore: true,
            },
        });
        await page.goto(`/users/${users.populated.id}/reviews`);
        const next = page
            .getByRole("navigation", { name: "Pagination" })
            .getByRole("button", { name: "NEXT", exact: true });
        api.respond("GET", path, {
            body: {
                reviews: [bookReviews[1]],
                currentPage: 2,
                totalPages: 2,
                totalCount: 2,
                hasMore: false,
            },
        });
        await next.focus();
        await page.keyboard.press("Enter");
        await expect(
            page.getByText("A Long Journey (2021)", { exact: true }),
        ).toBeVisible();
        await expect(next).toBeFocused();
        await expect(next).toBeInViewport();
        await expect(next).toHaveAttribute("aria-disabled", "true");
        await expect(
            page.getByRole("button", { name: "2", exact: true }),
        ).toHaveAttribute("aria-current", "page");
        const requests = api.requests.length;
        await next.press("Enter");
        expect(api.requests.length).toBe(requests);
    });

    test("short mobile menus scroll to the last keyboard control", async ({
        page,
    }) => {
        await page.setViewportSize({ width: 390, height: 240 });
        await page.goto("/movies");
        await page.getByRole("button", { name: "Toggle menu" }).click();
        await expect(
            page.getByRole("button", { name: "Close menu", exact: true }),
        ).toBeFocused();
        for (let index = 0; index < 5; index++)
            await page.keyboard.press("Tab");
        const logout = page.getByRole("button", {
            name: "LOGOUT",
            exact: true,
        });
        await expect(logout).toBeFocused();
        await expect(logout).toBeInViewport({ ratio: 1 });
        await page.keyboard.press("Escape");
    });

    test("logout closes the menu and returns to the trigger", async ({
        page,
        api,
    }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/movies");
        const trigger = page.getByRole("button", { name: "Toggle menu" });
        await trigger.click();
        api.respond("POST", "/auth/logout", { body: {} });
        api.respond("GET", "/auth/status", {
            body: { isAuthenticated: false },
        });
        await page
            .getByRole("button", { name: "LOGOUT", exact: true })
            .press("Enter");
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
});
