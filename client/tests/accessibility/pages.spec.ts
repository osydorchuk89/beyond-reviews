import { test, expect } from "./fixtures";
import { analyze, fingerprints, scan } from "./scan";
import { users } from "./data";

test.describe("Anonymous pages", () => {
    for (const entry of [
        {
            state: "home-anonymous",
            path: "/",
            ready: "Discover, Review, Connect",
        },
        { state: "movies-anonymous", path: "/movies", ready: "The Open Road" },
        {
            state: "books-anonymous",
            path: "/books",
            ready: "The Quiet Library",
        },
        { state: "login", path: "/login", ready: "Login to your account" },
        { state: "registration", path: "/registration", ready: "First Name:" },
        {
            state: "music-placeholder",
            path: "/music",
            ready: "This page is under development",
        },
        {
            state: "not-found",
            path: "/not-a-route",
            ready: "There is no such page...",
        },
    ]) {
        test(entry.state, async ({ page }, info) => {
            await page.goto(entry.path);
            await expect(
                page.getByText(entry.ready, { exact: true }).first(),
            ).toBeVisible();
            await scan(page, info, entry.state);
        });
    }

    test("login validation", async ({ page }, info) => {
        await page.goto("/login");
        await page.getByRole("button", { name: "LOGIN", exact: true }).click();
        await expect(
            page.getByText("Email is required", { exact: true }),
        ).toBeVisible();
        await expect(
            page.getByText("Password is required", { exact: true }),
        ).toBeVisible();
        await scan(page, info, "login-validation");
    });

    test("login server error", async ({ page, api }, info) => {
        api.respond("POST", "/auth/login", {
            status: 401,
            body: { message: "Invalid credentials" },
        });
        await page.goto("/login");
        await page
            .getByLabel("Email:", { exact: true })
            .fill("synthetic@example.test");
        await page
            .getByLabel("Password:", { exact: true })
            .fill("synthetic-test-password");
        await page.getByRole("button", { name: "LOGIN", exact: true }).click();
        await expect(
            page.getByText("Invalid credentials", { exact: true }),
        ).toBeVisible();
        await scan(page, info, "login-server-error");
    });

    test("mobile menu and registration errors", async ({ page }, info) => {
        await page.setViewportSize({ width: 320, height: 800 });
        await page.goto("/registration");
        await page
            .getByRole("button", { name: "REGISTER", exact: true })
            .click();
        await expect(
            page.getByText("This field is required", { exact: true }).first(),
        ).toBeVisible();
        await scan(page, info, "registration-mobile-errors");
        await page.getByRole("button", { name: "Toggle menu" }).click();
        await expect(
            page.getByRole("button", { name: "Close menu", exact: true }),
        ).toBeVisible();
        await scan(page, info, "mobile-menu-open");
    });

    test("search with no results", async ({ page }, info) => {
        await page.goto("/books");
        await expect(
            page.getByText("The Quiet Library", { exact: true }),
        ).toBeVisible();
        await page
            .getByLabel("Search", { exact: true })
            .fill("No matching fixture");
        await page
            .getByRole("button", { name: "Search", exact: true })
            .filter({ visible: true })
            .click();
        await expect(
            page.getByText("No books found", { exact: true }),
        ).toBeVisible();
        await scan(page, info, "books-empty-search");
    });

    test("mobile filters expanded", async ({ page }, info) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto("/movies");
        await expect(
            page.getByText("The Open Road", { exact: true }),
        ).toBeVisible();
        await page.getByRole("button", { name: "Filter:" }).click();
        await expect(
            page.getByRole("button", { name: "Filter:" }),
        ).toHaveAttribute("aria-expanded", "true");
        await scan(page, info, "movies-mobile-filters");
    });

    test("regression guard detects a new unlabeled field", async ({ page }) => {
        await page.goto("/login");
        await expect(page.getByLabel("Email:", { exact: true })).toBeVisible();
        const before = fingerprints((await analyze(page)).violations);
        await page.evaluate(() => {
            const input = document.createElement("input");
            input.id = "regression-probe";
            document.body.append(input);
        });
        const after = fingerprints((await analyze(page)).violations);
        expect(after).not.toEqual(before);
        expect(
            after.find((violation) => violation.rule === "label")?.nodes,
        ).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ target: ["#regression-probe"] }),
            ]),
        );
    });
});

for (const persona of ["empty", "populated"] as const) {
    test.describe(`${persona} authenticated user`, () => {
        test.use({ persona });
        const user = users[persona];
        const prefix = `/users/${user.id}`;
        for (const entry of [
            {
                state: "profile",
                path: `${prefix}/profile`,
                ready: `${user.firstName} ${user.lastName}`,
            },
            {
                state: "wishlist",
                path: `${prefix}/wishlist`,
                ready: "Wishlist",
            },
            { state: "reviews", path: `${prefix}/reviews`, ready: "Reviews" },
            {
                state: "activities",
                path: `${prefix}/activities`,
                ready: "Activities",
            },
            {
                state: "friends",
                path: `${prefix}/friends`,
                ready: "Suggested friends",
            },
            {
                state: "settings",
                path: `${prefix}/settings`,
                ready: "This page is under development",
            },
        ]) {
            test(entry.state, async ({ page }, info) => {
                await page.goto(entry.path);
                await expect(
                    page.getByText(entry.ready, { exact: true }).first(),
                ).toBeVisible();
                if (entry.state === "wishlist" || entry.state === "friends") {
                    const recommendations = page.locator("section").filter({
                        has: page.getByRole("heading", {
                            name:
                                entry.state === "friends"
                                    ? "Suggested friends"
                                    : "Recommended for you",
                        }),
                    });
                    await expect(recommendations).toBeVisible();
                    if (persona === "empty") {
                        await expect(
                            recommendations.getByText(/to unlock/),
                        ).toBeVisible();
                    } else {
                        await expect(
                            recommendations
                                .locator(
                                    'a[href^="/users/"], a[href^="/books/"]',
                                )
                                .first(),
                        ).toBeVisible();
                    }
                }
                if (entry.state === "reviews") {
                    await expect(
                        page
                            .getByText(
                                persona === "empty"
                                    ? "You have no books reviews yet"
                                    : "Review: Fixture review: clear characters and an enjoyable story.",
                                { exact: true },
                            )
                            .first(),
                    ).toBeVisible();
                }
                if (entry.state === "activities") {
                    await expect(
                        page.getByText(
                            persona === "empty"
                                ? "You have no books activities"
                                : "Review: Fixture activity review.",
                            { exact: true },
                        ),
                    ).toBeVisible();
                }
                await scan(page, info, `${entry.state}-${persona}`);
                if (entry.state === "wishlist") {
                    await page
                        .getByRole("tab", { name: "Movies", exact: true })
                        .click();
                    await expect(
                        page
                            .getByText(
                                persona === "empty"
                                    ? "There are no movies on your wishlist"
                                    : "The Open Road",
                                { exact: true },
                            )
                            .first(),
                    ).toBeVisible();
                    const movieRecommendations = page
                        .locator("section")
                        .filter({
                            has: page.getByRole("heading", {
                                name: "Recommended for you",
                            }),
                        });
                    await expect(movieRecommendations).toBeVisible();
                    await expect(
                        persona === "empty"
                            ? movieRecommendations.getByText(/to unlock/)
                            : movieRecommendations.getByText("The Open Road", {
                                  exact: true,
                              }),
                    ).toBeVisible();
                    await scan(page, info, `wishlist-movies-${persona}`);
                }
            });
        }

        for (const mediaType of ["books", "movies"] as const) {
            test(`${mediaType} catalog recommendations`, async ({
                page,
            }, info) => {
                await page.goto(`/${mediaType}`);
                const title =
                    mediaType === "books"
                        ? "The Quiet Library"
                        : "The Open Road";
                await expect(
                    page.getByText(title, { exact: true }).first(),
                ).toBeVisible();
                const recommendations = page.locator("section").filter({
                    has: page.getByRole("heading", {
                        name: "Recommended for you",
                    }),
                });
                if (persona === "empty") {
                    await expect(
                        recommendations.getByText(/to unlock/),
                    ).toBeVisible();
                } else {
                    await expect(
                        recommendations.getByText(title, { exact: true }),
                    ).toBeVisible();
                }
                await scan(page, info, `${mediaType}-catalog-${persona}`);
            });

            test(`${mediaType} detail`, async ({ page }, info) => {
                const singular = mediaType === "books" ? "book" : "movie";
                await page.goto(`/${mediaType}/${singular}-1`);
                await expect(
                    page.getByText("User Reviews", { exact: true }),
                ).toBeVisible();
                if (persona === "populated") {
                    await page
                        .getByRole("button", {
                            name: "EDIT YOUR REVIEW",
                            exact: true,
                        })
                        .click();
                }
                await expect(
                    page.getByLabel("Post your review (optional):", {
                        exact: true,
                    }),
                ).toBeVisible();
                await scan(page, info, `${mediaType}-review-${persona}`);
            });
        }

        test("other user's profile", async ({ page }, info) => {
            await page.goto(`/users/${users.received.id}/profile`);
            await expect(
                page.getByRole("button", {
                    name: "SEND FRIEND REQUEST",
                    exact: true,
                }),
            ).toBeVisible();
            await scan(page, info, `other-profile-${persona}`);
        });

        test("review tab error", async ({ page, api }, info) => {
            await page.goto(`${prefix}/reviews`);
            await expect(
                page.getByRole("tab", { name: "Movies", exact: true }),
            ).toBeVisible();
            api.respond("GET", `/api/users/${user.id}/movie-reviews`, {
                status: 500,
                body: { message: "Fixture request failure" },
            });
            await page
                .getByRole("tab", { name: "Movies", exact: true })
                .click();
            await expect(
                page.getByText("Could not load movies reviews.", {
                    exact: true,
                }),
            ).toBeVisible();
            await scan(page, info, `reviews-error-${persona}`);
        });
    });
}
