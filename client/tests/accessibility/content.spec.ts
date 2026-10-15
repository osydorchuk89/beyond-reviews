import { test, expect } from "./fixtures";
import { books, movies, bookReviews, movieReviews, paginated } from "./data";

test.describe("Results and expanded content", () => {
    test.use({ persona: "populated" });

    for (const media of ["books", "movies"] as const) {
        const items = media === "books" ? books : movies;
        const reviews = media === "books" ? bookReviews : movieReviews;
        const item = items[0];

        test(`${media} load-more errors allow retry and the final load moves focus to the new result`, async ({
            page,
            api,
        }) => {
            const path = `/api/${media}`;
            api.respond("GET", path, {
                body: {
                    ...paginated(items),
                    [media]: [items[0]],
                    appliedFilters: {},
                    hasMore: true,
                },
            });
            await page.goto(`/${media}`);
            const loadMore = page.getByRole("button", {
                name: "LOAD MORE",
                exact: true,
            });
            await expect(loadMore).toBeVisible();
            api.respond("GET", path, {
                status: 500,
                body: { message: "Fixture failure" },
            });
            await loadMore.press("Enter");
            await expect(
                page
                    .getByRole("alert")
                    .filter({ hasText: "Could not load more results" }),
            ).toBeVisible();
            await expect(loadMore).toBeFocused();
            await expect(page.locator("[data-catalog-list] > li")).toHaveCount(
                1,
            );
            api.respond("GET", path, {
                body: {
                    ...paginated([items[1]], 2),
                    [media]: [items[1]],
                    hasMore: false,
                },
            });
            await loadMore.press("Enter");
            await expect(loadMore).toHaveCount(0);
            await expect(page.locator("[data-catalog-list] > li")).toHaveCount(
                2,
            );
            await expect(
                page
                    .locator("[data-catalog-list] > li")
                    .nth(1)
                    .getByRole("link", { name: items[1].title, exact: true }),
            ).toBeFocused();
            await expect(
                page.getByRole("status").filter({
                    hasText: "1 more results loaded. 2 results shown.",
                }),
            ).toHaveCount(1);
            await expect(
                page
                    .getByRole("alert")
                    .filter({ hasText: "Could not load more results" }),
            ).toHaveCount(0);
        });

        test(`${media} review pagination announces failure and success while retaining the paging control`, async ({
            page,
            api,
        }) => {
            const path = `/api/${media}/${item.id}/reviews`;
            api.respond("GET", path, {
                body: {
                    ...paginated([reviews[0]]),
                    reviews: [reviews[0]],
                    userReview: reviews[0],
                    totalPages: 2,
                },
            });
            await page.goto(`/${media}/${item.id}`);
            const next = page
                .getByRole("navigation", { name: "Pagination" })
                .getByRole("button", { name: "NEXT", exact: true });
            await expect(next).toBeVisible();
            api.respond("GET", path, {
                status: 500,
                body: { message: "Fixture failure" },
            });
            await next.press("Enter");
            await expect(
                page
                    .getByRole("alert")
                    .filter({ hasText: "Could not load reviews" }),
            ).toBeVisible();
            await expect(next).toBeFocused();
            await expect(
                page
                    .getByRole("navigation", { name: "Pagination" })
                    .getByRole("button", { name: "1", exact: true }),
            ).toHaveAttribute("aria-current", "page");
            const nextReview = {
                ...reviews[1],
                text: "Second page review fixture.",
            };
            api.respond("GET", path, {
                body: {
                    ...paginated([nextReview], 2),
                    reviews: [nextReview],
                    totalPages: 2,
                },
            });
            await next.press("Enter");
            await expect(
                page.getByText("Second page review fixture.", { exact: true }),
            ).toBeVisible();
            await expect(next).toBeFocused();
            await expect(next).toHaveAttribute("aria-disabled", "true");
            await expect(
                page.getByRole("status").filter({
                    hasText: "Reviews loaded. Page 2. 1 reviews shown.",
                }),
            ).toHaveCount(1);
        });

        test(`${media} review expansion exposes its state and text relationship`, async ({
            page,
            api,
        }) => {
            const longReview = {
                ...reviews[0],
                text: "Long review fixture. ".repeat(300),
            };
            api.respond("GET", `/api/${media}/${item.id}/reviews`, {
                body: {
                    ...paginated([longReview]),
                    reviews: [longReview],
                    userReview: longReview,
                },
            });
            await page.goto(`/${media}/${item.id}`);
            const expanders = page.getByRole("button", {
                name: "Show more",
                exact: true,
            });
            await expect(expanders).toHaveCount(2);
            for (const index of [1, 0]) {
                const button = expanders.nth(index);
                await expect(button).toHaveAttribute("aria-expanded", "false");
                const controls = await button.getAttribute("aria-controls");
                const paragraph = page.locator(`[id="${controls}"]`);
                const previousHeight = await paragraph.evaluate(
                    (node) => node.clientHeight,
                );
                await button.press("Enter");
                const collapse = page.getByRole("button", {
                    name: "Show less",
                    exact: true,
                });
                await expect(collapse).toBeFocused();
                await expect(collapse).toHaveAttribute("aria-expanded", "true");
                expect(
                    await paragraph.evaluate((node) => node.clientHeight),
                ).toBeGreaterThan(previousHeight);
                await collapse.press("Space");
                await expect(expanders.nth(index)).toBeFocused();
                await expect(expanders.nth(index)).toHaveAttribute(
                    "aria-expanded",
                    "false",
                );
            }
        });

        test(`${media} recommendation controls keep focus at the scroll limit and reveal offscreen links`, async ({
            page,
        }) => {
            await page.setViewportSize({ width: 900, height: 900 });
            await page.goto(`/${media}`);
            const label = media === "books" ? "Book" : "Movie";
            const row = page.getByRole("region", {
                name: `${label} recommendations`,
                exact: true,
            });
            const right = page.getByRole("button", {
                name: `Scroll ${label.toLowerCase()} recommendations right`,
                exact: true,
            });
            const left = page.getByRole("button", {
                name: `Scroll ${label.toLowerCase()} recommendations left`,
                exact: true,
            });
            await expect(row).toBeVisible();
            await expect(right).toHaveAttribute(
                "aria-controls",
                (await row.getAttribute("id")) ?? "",
            );
            await expect(left).toHaveAttribute("aria-disabled", "true");
            await row.focus();
            await row.press("ArrowRight");
            await expect
                .poll(() => row.evaluate((node) => node.scrollLeft))
                .toBeGreaterThan(0);
            await right.focus();
            await right.press("Enter");
            await expect
                .poll(() => row.evaluate((node) => node.scrollLeft))
                .toBeGreaterThan(0);
            // Go to the end to check the unavailable control without animation timing.
            await row.evaluate((node) =>
                node.scrollTo({ left: node.scrollWidth, behavior: "instant" }),
            );
            await expect(right).toHaveAttribute("aria-disabled", "true");
            await expect(right).toBeFocused();
            const atLimit = await row.evaluate((node) => node.scrollLeft);
            await right.press("Enter");
            expect(await row.evaluate((node) => node.scrollLeft)).toBe(atLimit);
            await row.evaluate((node) =>
                node.scrollTo({ left: 0, behavior: "instant" }),
            );
            const lastTitle = row.getByRole("link", {
                name: items[2].title,
                exact: true,
            });
            await lastTitle.focus();
            await expect(lastTitle).toBeFocused();
            const visible = await lastTitle.evaluate((node) => {
                const link = node.getBoundingClientRect();
                const region = node.closest("section")?.getBoundingClientRect();
                return Boolean(
                    region &&
                        link.left >= region.left - 1 &&
                        link.right <= region.right + 1,
                );
            });
            expect(visible).toBe(true);
        });
    }
});
