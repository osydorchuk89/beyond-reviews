import { test, expect } from "./fixtures";
import { users } from "./data";
import { scan } from "./scan";

test.describe("Visible action errors", () => {
    test.use({ persona: "empty" });

    const likePath = "/api/books/book-1/reviews/review-book-1";
    const likeErrorText = "Could not update your like. Try again.";

    test("errors persist, announce once, and return keyboard focus on dismissal", async ({
        page,
        api,
    }) => {
        api.respond("PUT", likePath, { status: 500, body: {} });
        await page.goto("/books/book-1");
        const like = page.getByRole("button", {
            name: "Like review by Alex Reader",
            exact: true,
        });
        await like.focus();
        const mainSize = await page.getByRole("main").evaluate((node) => ({
            width: node.clientWidth,
            height: node.clientHeight,
        }));
        await page.clock.install();
        await like.press("Enter");
        const error = page
            .getByRole("alert")
            .filter({ hasText: likeErrorText });
        await expect(error).toBeVisible();
        await expect(error).toHaveCount(1);
        await expect(like).toBeFocused();
        expect(
            await page.getByRole("main").evaluate((node) => ({
                width: node.clientWidth,
                height: node.clientHeight,
            })),
        ).toEqual(mainSize);
        await page.clock.fastForward(10_000);
        await expect(error).toBeVisible();
        await page.keyboard.press("Alt+t");
        await expect(error).toBeFocused();
        await page.keyboard.press("Tab");
        await expect(
            error.getByRole("button", {
                name: "Dismiss notification",
                exact: true,
            }),
        ).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(error).toHaveCount(0);
        await expect(like).toBeFocused();
        // A new failed attempt should still notify after manual dismissal.
        await like.press("Enter");
        await expect(error).toBeVisible();
        await expect(error).toHaveCount(1);
    });

    test("independent errors survive a successful wishlist update and clear on retry or navigation", async ({
        page,
        api,
    }) => {
        api.respond("PUT", likePath, { status: 500, body: {} });
        api.respond("PUT", "/api/books/book-1", { status: 500, body: {} });
        await page.goto("/books/book-1");
        const like = page.getByRole("button", {
            name: "Like review by Alex Reader",
            exact: true,
        });
        const bookmark = page.getByRole("button", {
            name: "Save The Quiet Library to wishlist",
            exact: true,
        });
        await like.press("Enter");
        const likeError = page
            .getByRole("alert")
            .filter({ hasText: likeErrorText });
        await expect(likeError).toBeVisible();
        await bookmark.press("Enter");
        const wishlistError = page
            .getByRole("alert")
            .filter({ hasText: "Could not update your wishlist." });
        await expect(wishlistError).toBeVisible();
        await expect(likeError).toBeVisible();
        await expect(page.getByRole("alert")).toHaveCount(2);
        api.respond("PUT", "/api/books/book-1", { body: {} });
        await bookmark.press("Enter");
        await expect(wishlistError).toHaveCount(0);
        await expect(
            page
                .getByRole("alert")
                .filter({ hasText: "Book was added to your wishlist" }),
        ).toBeVisible();
        await expect(likeError).toBeVisible();
        const likeDismiss = likeError.getByRole("button", {
            name: "Dismiss notification",
            exact: true,
        });
        await likeDismiss.click();
        await expect(likeError).toHaveCount(0);
        await expect(bookmark).toHaveAttribute("aria-pressed", "true");
        await like.press("Enter");
        await expect(likeError).toBeVisible();
        await page
            .getByRole("navigation", { name: "Primary navigation" })
            .getByRole("link", { name: "Books", exact: true })
            .click();
        await expect(page).toHaveURL(/\/books$/);
        await expect(likeError).toHaveCount(0);
    });

    test("a late failure keeps the user's current focus", async ({ page }) => {
        let fail = () => {};
        const gate = new Promise<void>((resolve) => {
            fail = resolve;
        });
        await page.route(
            (url) => url.pathname === likePath,
            async (route) => {
                if (route.request().method() !== "PUT") return route.fallback();
                await gate;
                await route.fulfill({ status: 500, json: {} });
            },
        );
        await page.goto("/books/book-1");
        const like = page.getByRole("button", {
            name: "Like review by Alex Reader",
            exact: true,
        });
        await like.press("Enter");
        await expect(like).toHaveAttribute("aria-busy", "true");
        const other = page.getByRole("button", {
            name: "Save The Quiet Library to wishlist",
            exact: true,
        });
        await other.focus();
        fail();
        await expect(
            page.getByRole("alert").filter({ hasText: likeErrorText }),
        ).toBeVisible();
        await expect(other).toBeFocused();
    });
});

test.describe("Error notification scans", () => {
    test.use({ persona: "populated" });

    for (const width of [1280, 390]) {
        test(`friend request error at ${width}px`, async ({
            page,
            api,
        }, info) => {
            await page.setViewportSize({ width, height: 900 });
            api.respond(
                "POST",
                `/api/users/${users.populated.id}/friend-requests`,
                { status: 500, body: {} },
            );
            await page.goto(`/users/${users.received.id}/profile`);
            const send = page.getByRole("button", {
                name: "SEND FRIEND REQUEST",
                exact: true,
            });
            await send.press("Enter");
            const error = page
                .getByRole("alert")
                .filter({ hasText: "Could not send the friend request." });
            await expect(error).toBeVisible();
            await expect(error).toHaveCount(1);
            await expect(error).toBeInViewport({ ratio: 1 });
            await expect(send).toBeFocused();
            await info.attach("visible-error-notification", {
                body: await page.screenshot(),
                contentType: "image/png",
            });
            await scan(page, info, `friend-request-error-${width}`);
        });
    }
});
