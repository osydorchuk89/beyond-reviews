import { test, expect } from "./fixtures";
import { books, movies, paginated, users } from "./data";
import { scan } from "./scan";

const pageFailures = [
    {
        name: "root-auth",
        path: "/",
        apiPath: "/auth/status",
        body: { isAuthenticated: false },
        heading: "Discover, Review, Connect",
        title: "Home",
        header: false,
    },
    {
        name: "books-catalog",
        path: "/books",
        apiPath: "/api/books",
        body: { ...paginated(books), books, appliedFilters: {} },
        heading: "Popular Books",
        title: "Books",
        header: true,
    },
    {
        name: "movies-catalog",
        path: "/movies",
        apiPath: "/api/movies",
        body: { ...paginated(movies), movies, appliedFilters: {} },
        heading: "Popular Movies",
        title: "Movies",
        header: true,
    },
    {
        name: "book-detail",
        path: "/books/book-1",
        apiPath: "/api/books/book-1",
        body: books[0],
        heading: books[0].title,
        title: books[0].title,
        header: true,
    },
    {
        name: "movie-detail",
        path: "/movies/movie-1",
        apiPath: "/api/movies/movie-1",
        body: movies[0],
        heading: movies[0].title,
        title: movies[0].title,
        header: true,
    },
    {
        name: "profile",
        path: `/users/${users.empty.id}/profile`,
        apiPath: `/api/users/${users.empty.id}`,
        body: users.empty,
        heading: "Sam Newcomer — Profile",
        title: "Profile — Sam Newcomer",
        header: true,
    },
    {
        name: "user-reviews",
        path: `/users/${users.empty.id}/reviews`,
        apiPath: `/api/users/${users.empty.id}/book-reviews`,
        body: { ...paginated([]), reviews: [] },
        heading: "Sam Newcomer — Reviews",
        title: "Reviews — Sam Newcomer",
        header: true,
    },
];

for (const entry of pageFailures) {
    test(`${entry.name}: failed loads have a focused error screen and retry the same URL`, async ({
        page,
        api,
    }, info) => {
        api.respond("GET", entry.apiPath, {
            status: 500,
            body: { message: "Internal server diagnostic" },
        });
        await page.goto(entry.path);
        const heading = page.getByRole("heading", {
            level: 1,
            name: "Unable to load this page",
            exact: true,
        });
        await expect(heading).toBeFocused();
        await expect(page).toHaveTitle(
            "Unable to load this page | Beyond Reviews",
        );
        await expect(page.getByRole("banner")).toHaveCount(
            entry.header ? 1 : 0,
        );
        await expect(
            page.getByText("Internal server diagnostic", { exact: true }),
        ).toHaveCount(0);
        await scan(page, info, `recovery-${entry.name}-error`);
        const announcements = await page
            .getByRole("main")
            .getByRole("status")
            .evaluateHandle((status) => {
                const messages: string[] = [];
                const observer = new MutationObserver(() =>
                    messages.push(status.textContent ?? ""),
                );
                observer.observe(status, {
                    childList: true,
                    subtree: true,
                    characterData: true,
                });
                return { messages, observer };
            });
        api.respond("GET", entry.apiPath, { body: entry.body });
        await page
            .getByRole("button", { name: "TRY AGAIN", exact: true })
            .press("Enter");
        await expect(
            page.getByRole("heading", {
                level: 1,
                name: entry.heading,
                exact: true,
            }),
        ).toBeFocused();
        await expect(page).toHaveTitle(`${entry.title} | Beyond Reviews`);
        await expect(page).toHaveURL(entry.path);
        await expect(page.getByRole("main")).toHaveCount(1);
        await expect(page.getByRole("banner")).toHaveCount(1);
        const messages = await announcements.evaluate((log) => {
            log.observer.disconnect();
            return log.messages;
        });
        expect(messages).not.toContain(
            "Still unable to load this page. Please try again.",
        );
        await announcements.dispose();
        expect(
            api.requests.filter((request) => !request.startsWith("GET ")),
        ).toEqual([]);
    });
}

test("a lost connection during root loading can be retried", async ({
    page,
}) => {
    await page.route("**/auth/status", (route) =>
        route.abort("connectionfailed"),
    );
    await page.goto("/");
    await expect(
        page.getByRole("heading", {
            level: 1,
            name: "Unable to load this page",
            exact: true,
        }),
    ).toBeFocused();
    await page.unroute("**/auth/status");
    await page
        .getByRole("button", { name: "TRY AGAIN", exact: true })
        .press("Enter");
    await expect(
        page.getByRole("heading", {
            level: 1,
            name: "Discover, Review, Connect",
            exact: true,
        }),
    ).toBeFocused();
    await expect(page).toHaveTitle("Home | Beyond Reviews");
});

test("slow retries prevent duplicates, report another failure and remain retryable", async ({
    page,
    api,
}) => {
    api.respond("GET", "/auth/status", { status: 500, body: {} });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
        release = resolve;
    });
    let requests = 0;
    await page.route("**/auth/status", async (route) => {
        requests++;
        await gate;
        await route.fallback();
    });
    const retry = page.getByRole("button", { name: "TRY AGAIN", exact: true });
    await retry.press("Enter");
    await expect(retry).toHaveAttribute("aria-busy", "true");
    await expect(retry).toHaveAttribute("aria-disabled", "true");
    await expect(page.getByRole("status")).toHaveText("Trying again…");
    await retry.press("Enter");
    try {
        expect(requests).toBe(1);
    } finally {
        release();
    }
    await expect(retry).toHaveAttribute("aria-busy", "false");
    await expect(page.getByRole("status")).toHaveText(
        "Still unable to load this page. Please try again.",
    );
    await expect(retry).toBeFocused();
    api.respond("GET", "/auth/status", { body: { isAuthenticated: false } });
    await retry.press("Enter");
    await expect(
        page.getByRole("heading", {
            level: 1,
            name: "Discover, Review, Connect",
            exact: true,
        }),
    ).toBeFocused();
    expect(requests).toBe(2);
});

test("the recovery actions fit a narrow screen and the home link works", async ({
    page,
    api,
}) => {
    await page.setViewportSize({ width: 320, height: 640 });
    api.respond("GET", "/api/books", { status: 500, body: {} });
    await page.goto("/books");
    await expect(
        page.getByRole("heading", {
            level: 1,
            name: "Unable to load this page",
            exact: true,
        }),
    ).toBeFocused();
    const dimensions = await page.evaluate(() => ({
        viewport: innerWidth,
        document: document.documentElement.scrollWidth,
    }));
    expect(dimensions.document).toBe(dimensions.viewport);
    await page
        .getByRole("link", { name: "BACK TO HOME PAGE", exact: true })
        .press("Enter");
    await expect(
        page.getByRole("heading", {
            level: 1,
            name: "Discover, Review, Connect",
            exact: true,
        }),
    ).toBeFocused();
    await expect(page).toHaveURL("/");
});

test("successful retry does not steal focus from another control", async ({
    page,
    api,
}) => {
    api.respond("GET", "/api/books/book-1", { status: 500, body: {} });
    await page.goto("/books/book-1");
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    api.respond("GET", "/api/books/book-1", { body: books[0] });
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
        release = resolve;
    });
    await page.route("**/api/books/book-1", async (route) => {
        await gate;
        await route.fallback();
    });
    const retry = page.getByRole("button", { name: "TRY AGAIN", exact: true });
    await retry.press("Enter");
    await expect(retry).toHaveAttribute("aria-busy", "true");
    // A user may move to the header while waiting; keep that choice of focus.
    const home = page
        .locator("header")
        .getByRole("link", { name: "Beyond Reviews", exact: true });
    await home.focus();
    release();
    await expect(
        page.getByRole("heading", {
            level: 1,
            name: books[0].title,
            exact: true,
        }),
    ).toBeVisible();
    await expect(home).toBeFocused();
    await expect(page).toHaveTitle(`${books[0].title} | Beyond Reviews`);
});

for (const media of ["books", "movies"] as const) {
    test(`${media}: genuine missing items use the existing recovery link`, async ({
        page,
        api,
    }, info) => {
        const singular = media === "books" ? "book" : "movie";
        api.respond("GET", `/api/${media}/${singular}-1`, {
            status: 404,
            body: { message: "Not found" },
        });
        await page.goto(`/${media}/${singular}-1`);
        await expect(
            page.getByRole("heading", {
                level: 1,
                name: `${media === "books" ? "Book" : "Movie"} not found`,
                exact: true,
            }),
        ).toBeVisible();
        await scan(page, info, `recovery-${media}-missing`);
        await page
            .getByRole("link", {
                name: `BACK TO ALL ${media.toUpperCase()}`,
                exact: true,
            })
            .press("Enter");
        await expect(page).toHaveURL(`/${media}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    });
}

test.describe("Sign-out recovery", () => {
    test.use({ persona: "populated" });

    test("a slow sign-out cannot be submitted again after switching to mobile navigation", async ({
        page,
        api,
    }) => {
        let release!: () => void;
        const gate = new Promise<void>((resolve) => {
            release = resolve;
        });
        let posts = 0;
        api.respond("POST", "/auth/logout", { body: {} });
        await page.route("**/auth/logout", async (route) => {
            posts++;
            await gate;
            await route.fallback();
        });
        await page.goto("/movies");
        const logout = page.getByRole("button", {
            name: "LOGOUT",
            exact: true,
        });
        await logout.press("Enter");
        await expect(logout).toHaveAttribute("aria-busy", "true");
        await expect(
            page.getByRole("status").filter({ hasText: "Signing out…" }),
        ).toHaveCount(1);
        await page.setViewportSize({ width: 390, height: 844 });
        await page
            .getByRole("button", { name: "Toggle menu", exact: true })
            .press("Enter");
        await expect(logout).toHaveAttribute("aria-disabled", "true");
        await logout.press("Enter");
        try {
            expect(posts).toBe(1);
        } finally {
            api.respond("GET", "/auth/status", {
                body: { isAuthenticated: false },
            });
            release();
        }
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(logout).toHaveCount(0);
        expect(posts).toBe(1);
    });

    for (const mobile of [false, true]) {
        test(`${mobile ? "mobile" : "desktop"}: failed sign-out is persistent, keyboard dismissible and retryable`, async ({
            page,
            api,
        }, info) => {
            if (mobile) await page.setViewportSize({ width: 390, height: 844 });
            await page.goto("/movies");
            if (mobile)
                await page
                    .getByRole("button", { name: "Toggle menu", exact: true })
                    .press("Enter");
            api.respond("POST", "/auth/logout", { status: 500, body: {} });
            const logout = page.getByRole("button", {
                name: "LOGOUT",
                exact: true,
            });
            await logout.press("Enter");
            const error = page
                .getByRole("alert")
                .filter({ hasText: "Could not sign out. Try again." });
            await expect(error).toBeVisible();
            await expect(error).toHaveCount(1);
            await expect(page.getByRole("dialog")).toHaveCount(0);
            if (mobile)
                await expect(
                    page.getByRole("button", {
                        name: "Toggle menu",
                        exact: true,
                    }),
                ).toBeFocused();
            else await expect(logout).toBeFocused();
            await scan(
                page,
                info,
                `recovery-logout-${mobile ? "mobile" : "desktop"}`,
            );
            await page.clock.install();
            await page.clock.fastForward(10_000);
            await expect(error).toBeVisible();
            await page.keyboard.press("Alt+t");
            await page.keyboard.press("Tab");
            await page.keyboard.press("Enter");
            await expect(error).toHaveCount(0);
            api.respond("POST", "/auth/logout", { body: {} });
            api.respond("GET", "/auth/status", {
                body: { isAuthenticated: false },
            });
            if (mobile)
                await page
                    .getByRole("button", { name: "Toggle menu", exact: true })
                    .press("Enter");
            await logout.press("Enter");
            await expect(logout).toHaveCount(0);
            expect(
                api.requests.filter(
                    (request) => request === "POST /auth/logout",
                ),
            ).toHaveLength(2);
        });
    }
});
