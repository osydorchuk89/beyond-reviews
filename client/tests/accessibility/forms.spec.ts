import { test, expect } from "./fixtures";
import { bookReviews, movieReviews, users } from "./data";
import { scan } from "./scan";

test.describe("Search forms", () => {
    for (const media of ["books", "movies"]) {
        test(`${media} search has a label, validates, and restores focus when cleared`, async ({
            page,
            api,
        }) => {
            await page.goto(`/${media}`);
            const search = page.getByRole("search", { name: "Catalog search" });
            const input = search.getByLabel("Search", { exact: true });
            await input.fill("   ");
            const requests = api.requests.length;
            await input.press("Enter");
            await expect(input).toBeFocused();
            await expect(input).toHaveAttribute("aria-invalid", "true");
            await expect(input).toHaveAccessibleDescription(
                "Enter a title to search.",
            );
            await expect(search.getByRole("alert")).toHaveText(
                "Enter a title to search.",
            );
            expect(api.requests.length).toBe(requests);
            await input.fill(media === "books" ? "Quiet" : "Open");
            await input.press("Enter");
            await expect(page).toHaveURL(/search=/);
            const clear = search.getByRole("button", { name: "Clear search" });
            await clear.press("Enter");
            await expect(input).toBeFocused();
            await expect(page).not.toHaveURL(/search=/);
        });
    }
});

async function fillRegistration(page: import("@playwright/test").Page) {
    await page.getByLabel("First Name:", { exact: true }).fill("Jamie");
    await page.getByLabel("Last Name:", { exact: true }).fill("Reader");
    await page.getByLabel("Email:", { exact: true }).fill("jamie@example.test");
    await page
        .getByLabel("Password:", { exact: true })
        .fill("Valid-password-123");
}

test.describe("Authentication forms", () => {
    test("login errors identify fields and focus the first invalid input", async ({
        page,
    }) => {
        await page.goto("/login");
        await page.getByRole("button", { name: "LOGIN", exact: true }).click();
        const email = page.getByLabel("Email:", { exact: true });
        const password = page.getByLabel("Password:", { exact: true });
        await expect(email).toBeFocused();
        await expect(email).toHaveAttribute("aria-invalid", "true");
        await expect(email).toHaveAccessibleDescription("Email is required");
        await expect(password).toHaveAccessibleDescription(
            "Password is required",
        );
        await expect(page.getByRole("alert")).toHaveText(
            "Please correct the fields above.",
        );
    });

    test("autofill purposes and pasted passwords are supported", async ({
        page,
        context,
    }) => {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
        for (const entry of [
            { path: "/login", email: "username", password: "current-password" },
            { path: "/registration", email: "email", password: "new-password" },
        ]) {
            await page.goto(entry.path);
            const password = page.getByLabel("Password:", { exact: true });
            await expect(
                page.getByLabel("Email:", { exact: true }),
            ).toHaveAttribute("autocomplete", entry.email);
            await expect(password).toHaveAttribute(
                "autocomplete",
                entry.password,
            );
            await page.evaluate(() =>
                navigator.clipboard.writeText("Pasted-password-123!"),
            );
            await password.focus();
            await password.press("Control+V");
            await expect(password).toHaveValue("Pasted-password-123!");
        }
        await expect(
            page.getByLabel("First Name:", { exact: true }),
        ).toHaveAttribute("autocomplete", "given-name");
        await expect(
            page.getByLabel("Last Name:", { exact: true }),
        ).toHaveAttribute("autocomplete", "family-name");
    });

    test("login failure preserves credentials and announces an error", async ({
        page,
        api,
    }) => {
        api.respond("POST", "/auth/login", {
            status: 401,
            body: { message: "Invalid credentials" },
        });
        await page.goto("/login");
        await page
            .getByLabel("Email:", { exact: true })
            .fill("jamie@example.test");
        const password = page.getByLabel("Password:", { exact: true });
        await password.fill("Pasted-password-123!");
        const login = page.getByRole("button", { name: "LOGIN", exact: true });
        await login.click();
        await expect(page.getByRole("alert")).toHaveText("Invalid credentials");
        await expect(password).toHaveValue("Pasted-password-123!");
        await expect(login).toBeFocused();
        await page
            .getByRole("button", { name: "Dismiss login error" })
            .press("Enter");
        await expect(page.getByLabel("Email:", { exact: true })).toBeFocused();
    });

    test("registration exposes requirements and associates all field errors", async ({
        page,
    }) => {
        await page.goto("/registration");
        await expect(
            page.getByLabel("Password:", { exact: true }),
        ).toHaveAccessibleDescription("Use at least eight characters.");
        await expect(
            page.getByLabel("Photo (optional):", { exact: true }),
        ).toHaveAccessibleDescription(
            "JPEG, PNG, or WebP. Maximum file size: 5 MiB.",
        );
        await page
            .getByRole("button", { name: "REGISTER", exact: true })
            .click();
        await expect(
            page.getByLabel("First Name:", { exact: true }),
        ).toBeFocused();
        for (const label of [
            "First Name:",
            "Last Name:",
            "Email:",
            "Password:",
        ]) {
            const input = page.getByLabel(label, { exact: true });
            await expect(input).toHaveAttribute("aria-invalid", "true");
            await expect(input).toHaveAccessibleDescription(
                /This field is required/,
            );
        }
    });

    for (const kind of ["type", "size"] as const) {
        test(`registration explains invalid photo ${kind}`, async ({
            page,
            api,
        }) => {
            await page.goto("/registration");
            await fillRegistration(page);
            const photo = page.getByLabel("Photo (optional):", { exact: true });
            await photo.setInputFiles({
                name: kind === "type" ? "photo.txt" : "photo.png",
                mimeType: kind === "type" ? "text/plain" : "image/png",
                buffer: Buffer.alloc(
                    kind === "size" ? 5 * 1024 * 1024 + 1 : 10,
                ),
            });
            await page
                .getByRole("button", { name: "REGISTER", exact: true })
                .click();
            await expect(photo).toBeFocused();
            await expect(photo).toHaveAttribute("aria-invalid", "true");
            await expect(photo).toHaveAccessibleDescription(
                kind === "type"
                    ? /Only jpg, jpeg, png, or webp/
                    : /Photo size should not exceed 5 MiB/,
            );
            expect(
                api.requests.some((request) => request === "POST /api/users"),
            ).toBe(false);
        });
    }

    for (const status of [409, 500]) {
        test(`registration reports ${status} errors without losing values`, async ({
            page,
            api,
        }) => {
            api.respond("POST", "/api/users", {
                status,
                body: {
                    message: "The email service is temporarily unavailable",
                },
            });
            await page.goto("/registration");
            await fillRegistration(page);
            await page
                .getByRole("button", { name: "REGISTER", exact: true })
                .click();
            const email = page.getByLabel("Email:", { exact: true });
            if (status === 409) {
                await expect(email).toBeFocused();
                await expect(email).toHaveAccessibleDescription(
                    "User with this email already exists",
                );
            } else {
                await expect(page.getByRole("alert")).toHaveText(
                    "The email service is temporarily unavailable",
                );
            }
            await expect(email).toHaveValue("jamie@example.test");
            await expect(
                page.getByLabel("Password:", { exact: true }),
            ).toHaveValue("Valid-password-123");
        });
    }
});

for (const media of ["books", "movies"] as const) {
    const singular = media === "books" ? "book" : "movie";
    const path = `/${media}/${singular}-1`;
    const apiPath = `/api${path}/reviews`;

    test.describe(`${media} review creation`, () => {
        test.use({ persona: "empty" });

        test("requires a rating and supports native keyboard selection", async ({
            page,
            api,
        }, info) => {
            await page.setViewportSize({ width: 320, height: 800 });
            await page.goto(path);
            const form = page.getByRole("form", {
                name: `Your ${singular} review`,
            });
            await expect(
                form.getByRole("group", { name: `Rate the ${singular}:` }),
            ).toBeVisible();
            await form
                .getByRole("button", { name: "SUBMIT", exact: true })
                .click();
            const first = form.getByRole("radio", {
                name: "1 out of 10",
                exact: true,
            });
            await expect(first).toBeFocused();
            await expect(first).toHaveAccessibleDescription(
                /Select a rating from 1 to 10/,
            );
            expect(
                api.requests.some((request) => request === `POST ${apiPath}`),
            ).toBe(false);
            await first.press("Space");
            await first.press("ArrowRight");
            await expect(
                form.getByRole("radio", { name: "2 out of 10", exact: true }),
            ).toBeChecked();
            await expect(
                form.getByText("Selected rating: 2 out of 10"),
            ).toBeVisible();
            await info.attach("keyboard-focused-star-rating", {
                body: await page.screenshot(),
                contentType: "image/png",
            });
            const focusedStar = form.getByRole("radio", {
                name: "2 out of 10",
                exact: true,
            });
            for (const forcedColors of ["none", "active"] as const) {
                await page.emulateMedia({ forcedColors });
                const outline = await focusedStar.evaluate((input) => {
                    const label = input.closest("label");
                    if (!label)
                        throw new Error(
                            "Rating choice has no visible star label",
                        );
                    const style = getComputedStyle(label);
                    return {
                        width: parseFloat(style.outlineWidth),
                        style: style.outlineStyle,
                        shadow: style.boxShadow,
                    };
                });
                expect(outline.width).toBeGreaterThanOrEqual(3);
                expect(outline.style).toBe("solid");
                if (forcedColors === "active")
                    expect(outline.shadow).toBe("none");
            }
            await page.emulateMedia({ forcedColors: "none" });
            const mouseStar = form.getByRole("radio", {
                name: "4 out of 10",
                exact: true,
            });
            await mouseStar.click();
            await expect(mouseStar).toBeChecked();
            const mouseAppearance = await mouseStar.evaluate((input) => {
                const label = input.closest("label");
                if (!label)
                    throw new Error("Rating choice has no visible star label");
                const style = getComputedStyle(label);
                return {
                    outline: style.outlineStyle,
                    border: parseFloat(style.borderWidth),
                };
            });
            expect(mouseAppearance.outline).toBe("none");
            expect(mouseAppearance.border).toBe(0);
            await info.attach("mouse-selected-star-rating", {
                body: await page.screenshot(),
                contentType: "image/png",
            });
            await mouseStar.press("ArrowRight");
            const keyboardStar = form.getByRole("radio", {
                name: "5 out of 10",
                exact: true,
            });
            await expect(keyboardStar).toBeChecked();
            await expect(keyboardStar).toBeFocused();
            const keyboardOutline = await keyboardStar.evaluate((input) => {
                const label = input.closest("label");
                if (!label)
                    throw new Error("Rating choice has no visible star label");
                return parseFloat(getComputedStyle(label).outlineWidth);
            });
            expect(keyboardOutline).toBeGreaterThanOrEqual(3);
            await form
                .getByLabel("Post your review (optional):", { exact: true })
                .fill("Draft to cancel");
            await form
                .getByRole("button", { name: "CANCEL", exact: true })
                .click();
            await expect(
                form.getByLabel("Post your review (optional):", {
                    exact: true,
                }),
            ).toHaveValue("");
            await expect(form.getByText("Selected rating: None")).toBeVisible();
        });

        test("successful creation shows the saved review and keeps a useful focus", async ({
            page,
            api,
        }) => {
            await page.goto(path);
            const form = page.getByRole("form", {
                name: `Your ${singular} review`,
            });
            await form
                .getByRole("radio", { name: "8 out of 10", exact: true })
                .check();
            const review = {
                ...(media === "books" ? bookReviews[0] : movieReviews[0]),
                rating: 8,
                text: "Created review",
                user: users.empty,
                userId: users.empty.id,
            };
            api.respond("POST", apiPath, { body: {} });
            api.respond("GET", apiPath, {
                body: {
                    reviews: [review],
                    userReview: review,
                    currentPage: 1,
                    totalPages: 1,
                    totalCount: 1,
                    hasMore: false,
                },
            });
            await form
                .getByLabel("Post your review (optional):", { exact: true })
                .fill("Created review");
            await form
                .getByRole("button", { name: "SUBMIT", exact: true })
                .click();
            await expect(
                page.getByRole("button", {
                    name: "EDIT YOUR REVIEW",
                    exact: true,
                }),
            ).toBeFocused();
            await expect(
                page
                    .getByRole("status")
                    .filter({ hasText: "Your review was saved." }),
            ).toBeVisible();
            await page
                .getByRole("button", { name: "EDIT YOUR REVIEW", exact: true })
                .press("Enter");
            await expect(
                form.getByRole("radio", { name: "8 out of 10", exact: true }),
            ).toBeFocused();
            await expect(
                form.getByRole("radio", { name: "8 out of 10", exact: true }),
            ).toBeInViewport({ ratio: 1 });
            await expect(
                form.getByLabel("Post your review (optional):", {
                    exact: true,
                }),
            ).toHaveValue("Created review");
        });
    });

    test.describe(`${media} review editing`, () => {
        test.use({ persona: "populated" });

        test("slow failed save preserves draft, prevents duplicates, and can be retried", async ({
            page,
            api,
        }, info) => {
            await page.goto(path);
            const edit = page.getByRole("button", {
                name: "EDIT YOUR REVIEW",
                exact: true,
            });
            await edit.click();
            const form = page.getByRole("form", {
                name: `Your ${singular} review`,
            });
            await form
                .getByRole("radio", { name: "9 out of 10", exact: true })
                .check();
            const text = form.getByLabel("Post your review (optional):", {
                exact: true,
            });
            await text.fill("Keep my unsaved draft");
            let release!: () => void;
            const gate = new Promise<void>((resolve) => {
                release = resolve;
            });
            let posts = 0;
            await page.route(`**${apiPath}`, async (route) => {
                if (route.request().method() !== "POST")
                    return route.fallback();
                posts++;
                expect(route.request().postDataJSON()).toMatchObject({
                    rating: 9,
                    text: "Keep my unsaved draft",
                });
                await gate;
                await route.fulfill({
                    status: 500,
                    json: { message: "Save unavailable" },
                });
            });
            const save = form.getByRole("button", {
                name: /^(EDIT|Please wait\.\.\.)$/,
            });
            await save.click();
            try {
                await expect(form).toHaveAttribute("aria-busy", "true");
                await expect(save).toBeFocused();
                await expect(text).toHaveValue("Keep my unsaved draft");
                await expect(text).toHaveAttribute("readonly", "");
                await expect(
                    page
                        .getByRole("status")
                        .filter({ hasText: "Saving your review" }),
                ).toHaveText("Saving your review…");
                await save.press("Enter");
                await form
                    .getByRole("button", { name: "CANCEL", exact: true })
                    .click({ force: true });
                expect(posts).toBe(1);
            } finally {
                release();
            }
            await expect(form.getByRole("alert")).toContainText(
                "Save unavailable",
            );
            await expect(text).toHaveValue("Keep my unsaved draft");
            await expect(
                form.getByRole("radio", { name: "9 out of 10", exact: true }),
            ).toBeChecked();
            await info.attach("failed-review-save", {
                body: await page.screenshot(),
                contentType: "image/png",
            });
            await scan(page, info, `${media}-review-save-error`);
            await page.unroute(`**${apiPath}`);
            api.respond("POST", apiPath, { body: {} });
            const review = {
                ...(media === "books" ? bookReviews[0] : movieReviews[0]),
                rating: 9,
                text: "Keep my unsaved draft",
            };
            api.respond("GET", apiPath, {
                body: {
                    reviews: [review],
                    userReview: review,
                    currentPage: 1,
                    totalPages: 1,
                    totalCount: 1,
                    hasMore: false,
                },
            });
            await save.click();
            await expect(edit).toBeFocused();
            await expect(edit).toBeInViewport({ ratio: 1 });
            await expect(form).toHaveCount(0);
            await edit.press("Enter");
            await expect(text).toHaveValue("Keep my unsaved draft");
            await expect(
                form.getByRole("radio", { name: "9 out of 10", exact: true }),
            ).toBeFocused();
            await expect(
                form.getByRole("radio", { name: "9 out of 10", exact: true }),
            ).toBeInViewport({ ratio: 1 });
            await text.fill("Cancel this edit");
            await form
                .getByRole("button", { name: "CANCEL", exact: true })
                .click();
            await expect(edit).toBeFocused();
        });

        test("network errors retain the edit form", async ({ page }) => {
            await page.goto(path);
            await page
                .getByRole("button", { name: "EDIT YOUR REVIEW", exact: true })
                .click();
            const form = page.getByRole("form", {
                name: `Your ${singular} review`,
            });
            const text = form.getByLabel("Post your review (optional):", {
                exact: true,
            });
            await text.fill("Network failure draft");
            await page.route(`**${apiPath}`, async (route) =>
                route.request().method() === "POST"
                    ? route.abort("failed")
                    : route.fallback(),
            );
            await form
                .getByRole("button", { name: "EDIT", exact: true })
                .click();
            await expect(form.getByRole("alert")).toContainText(
                "Failed to submit review",
            );
            await expect(text).toHaveValue("Network failure draft");
        });

        test("expired sessions keep the draft and explain the failed save", async ({
            page,
            api,
        }) => {
            await page.goto(path);
            await page
                .getByRole("button", { name: "EDIT YOUR REVIEW", exact: true })
                .click();
            const form = page.getByRole("form", {
                name: `Your ${singular} review`,
            });
            const text = form.getByLabel("Post your review (optional):", {
                exact: true,
            });
            await text.fill("Session expired draft");
            api.respond("GET", "/auth/status", {
                body: { isAuthenticated: false },
            });
            await form
                .getByRole("button", { name: "EDIT", exact: true })
                .click();
            await expect(form.getByRole("alert")).toContainText(
                "Please sign in again",
            );
            await expect(text).toHaveValue("Session expired draft");
            expect(
                api.requests.some((request) => request === `POST ${apiPath}`),
            ).toBe(false);
        });

        test("an unavailable session check keeps the draft", async ({
            page,
            api,
        }) => {
            await page.goto(path);
            await page
                .getByRole("button", { name: "EDIT YOUR REVIEW", exact: true })
                .click();
            const form = page.getByRole("form", {
                name: `Your ${singular} review`,
            });
            const text = form.getByLabel("Post your review (optional):", {
                exact: true,
            });
            await text.fill("Session request failure draft");
            api.respond("GET", "/auth/status", {
                status: 503,
                body: { message: "Session service unavailable" },
            });
            await form
                .getByRole("button", { name: "EDIT", exact: true })
                .click();
            await expect(form.getByRole("alert")).toContainText(
                "Session service unavailable",
            );
            await expect(text).toHaveValue("Session request failure draft");
            expect(
                api.requests.some((request) => request === `POST ${apiPath}`),
            ).toBe(false);
        });
    });
}
