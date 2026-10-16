import type { Locator, Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import {
    books,
    movies,
    bookReviews,
    movieReviews,
    paginated,
    users,
} from "./data";
import { analyze } from "./scan";

// Font-size overrides exercise layout but do not replace native text-zoom testing.
const modes = ["desktop", "narrow", "large-text", "spacing"] as const;
type Mode = (typeof modes)[number];

async function setReadingMode(page: Page, mode: Mode) {
    if (mode === "spacing") {
        await page.addStyleTag({
            content: `
                * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
                p { margin-bottom: 2em !important; }
            `,
        });
    }
    if (mode === "large-text") {
        await page.evaluate(() => {
            const sizes = Array.from(
                document.querySelectorAll<HTMLElement>("body *"),
                (node) => ({
                    node,
                    size: Number.parseFloat(getComputedStyle(node).fontSize),
                }),
            );
            for (const { node, size } of sizes) {
                node.style.setProperty(
                    "font-size",
                    `${size * 2}px`,
                    "important",
                );
            }
        });
    }
}

async function expectNoPageOverflow(page: Page) {
    const dimensions = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
    }));
    expect(dimensions.content).toBe(dimensions.viewport);
}

async function expectInside(control: Locator, container: Locator) {
    const outer = await container.boundingBox();
    const inner = await control.boundingBox();
    expect(outer).not.toBeNull();
    expect(inner).not.toBeNull();
    if (!outer || !inner) return;
    expect(inner.x).toBeGreaterThanOrEqual(outer.x - 1);
    expect(inner.x + inner.width).toBeLessThanOrEqual(
        outer.x + outer.width + 1,
    );
}

async function expectUnobscuredFocus(page: Page, control: Locator) {
    await expect(control).toBeFocused();
    const target = await control.boundingBox();
    const header = await page.getByRole("banner").boundingBox();
    expect(target).not.toBeNull();
    expect(header).not.toBeNull();
    if (!target || !header) return;
    expect(target.y).toBeGreaterThanOrEqual(header.y + header.height);
    expect(target.y + target.height).toBeLessThanOrEqual(
        (await page.viewportSize())?.height ?? 0,
    );
}

test.describe("Reading layouts", () => {
    for (const mode of modes) {
        test.describe(mode, () => {
            test.use({
                viewport: {
                    width: mode === "narrow" || mode === "spacing" ? 320 : 1280,
                    height: 900,
                },
            });

            test("registration fields fit the form and keep their labels", async ({
                page,
            }) => {
                await page.goto("/registration");
                await expect(
                    page.getByLabel("First Name:", { exact: true }),
                ).toBeVisible();
                await setReadingMode(page, mode);
                const form = page.locator("form");
                if (mode === "desktop")
                    expect((await form.boundingBox())?.width).toBe(576);
                for (const label of [
                    "First Name:",
                    "Last Name:",
                    "Email:",
                    "Password:",
                    "Photo (optional):",
                ]) {
                    await expectInside(
                        page.getByLabel(label, { exact: true }),
                        form,
                    );
                }
                await page
                    .getByRole("button", { name: "REGISTER", exact: true })
                    .press("Enter");
                await expect(
                    page.getByLabel("First Name:", { exact: true }),
                ).toBeFocused();
                await expectNoPageOverflow(page);
            });

            test("login grows with its content and keeps the Google logo clear of its label", async ({
                page,
            }) => {
                await page.goto("/login");
                const form = page.getByTestId("login-form");
                await expect(form).toBeVisible();
                await setReadingMode(page, mode);
                const main = await page.getByRole("main").boundingBox();
                const bounds = await form.boundingBox();
                expect(main).not.toBeNull();
                expect(bounds).not.toBeNull();
                if (main && bounds) {
                    expect(bounds.y).toBeGreaterThanOrEqual(main.y);
                    expect(bounds.y + bounds.height).toBeLessThanOrEqual(
                        main.y + main.height,
                    );
                }
                const google = form.getByRole("link", {
                    name: "Login with Google",
                    exact: true,
                });
                const logo = await google.locator("svg").boundingBox();
                const label = await google.locator("p").boundingBox();
                expect(logo).not.toBeNull();
                expect(label).not.toBeNull();
                if (logo && label)
                    expect(logo.x + logo.width).toBeLessThanOrEqual(label.x);
                await expectInside(google, form);
                await expectNoPageOverflow(page);
            });

            for (const media of ["books", "movies"] as const) {
                test(`${media} card titles fit their headers and stay above metadata`, async ({
                    page,
                    api,
                }) => {
                    const original = media === "books" ? books[0] : movies[0];
                    const item = {
                        ...original,
                        title:
                            mode === "desktop"
                                ? original.title
                                : "A very long title about journeys, friendships and discoveries in distant places",
                    };
                    api.respond("GET", `/api/${media}`, {
                        body: {
                            ...paginated([item]),
                            [media]: [item],
                            appliedFilters: {},
                        },
                    });
                    await page.goto(`/${media}`);
                    const card = page
                        .locator("[data-catalog-list] .w-76")
                        .first();
                    const title = card.getByRole("link", {
                        name: item.title,
                        exact: true,
                    });
                    await expect(title).toBeVisible();
                    await setReadingMode(page, mode);
                    const heading = title.locator("..");
                    await expectInside(title, heading);
                    const headingBox = await heading.boundingBox();
                    const titleBox = await title.boundingBox();
                    const metadata = await card
                        .locator(":scope > p")
                        .nth(1)
                        .boundingBox();
                    expect(headingBox).not.toBeNull();
                    expect(titleBox).not.toBeNull();
                    expect(metadata).not.toBeNull();
                    if (headingBox && titleBox && metadata) {
                        expect(titleBox.y).toBeGreaterThanOrEqual(headingBox.y);
                        expect(
                            titleBox.y + titleBox.height,
                        ).toBeLessThanOrEqual(headingBox.y + headingBox.height);
                        expect(metadata.y).toBeGreaterThanOrEqual(
                            headingBox.y + headingBox.height,
                        );
                        if (mode === "desktop")
                            expect(headingBox.height).toBe(64);
                    }
                    await expectNoPageOverflow(page);
                });
            }

            test.describe("Authenticated reviews", () => {
                test.use({ persona: "empty" });
                for (const media of ["books", "movies"] as const) {
                    const item = media === "books" ? books[0] : movies[0];
                    test(`${media} keep ten usable stars in one row and actions within the form`, async ({
                        page,
                    }) => {
                        await page.goto(`/${media}/${item.id}`);
                        const form = page.getByRole("form", {
                            name: `Your ${media === "books" ? "book" : "movie"} review`,
                            exact: true,
                        });
                        await expect(form).toBeVisible();
                        await setReadingMode(page, mode);
                        const stars = form.getByRole("radio");
                        await expect(stars).toHaveCount(10);
                        const boxes = await stars.evaluateAll((nodes) =>
                            nodes.map((node) => {
                                const box = node.getBoundingClientRect();
                                return {
                                    width: box.width,
                                    height: box.height,
                                    top: box.top,
                                };
                            }),
                        );
                        for (const box of boxes) {
                            expect(box.width).toBeGreaterThanOrEqual(24);
                            expect(box.height).toBeGreaterThanOrEqual(24);
                            expect(box.top).toBeCloseTo(boxes[0].top, 1);
                            if (mode === "desktop") expect(box.width).toBe(32);
                        }
                        await expectInside(stars.first(), form);
                        await expectInside(stars.last(), form);
                        await stars.first().press("Space");
                        for (let index = 1; index < 10; index++) {
                            await stars.nth(index - 1).press("ArrowRight");
                            await expect(stars.nth(index)).toBeChecked();
                        }
                        await expectUnobscuredFocus(page, stars.last());
                        await expect(stars.last().locator("..")).toHaveCSS(
                            "outline-style",
                            "solid",
                        );
                        await expectInside(
                            form.getByRole("button", {
                                name: "CANCEL",
                                exact: true,
                            }),
                            form,
                        );
                        await expectInside(
                            form.getByRole("button", {
                                name: "SUBMIT",
                                exact: true,
                            }),
                            form,
                        );
                        await expectNoPageOverflow(page);
                    });
                }
            });
        });
    }
});

test.describe("Recommendation panel layouts", () => {
    test.use({ persona: "populated" });
    for (const width of [320, 390, 768]) {
        for (const kind of ["book", "movie", "friend"] as const) {
            test(`${kind} recommendations fit their panels at ${width}px and reveal focused links`, async ({
                page,
                api,
            }) => {
                await page.setViewportSize({ width, height: 900 });
                if (kind === "friend") {
                    api.respond(
                        "GET",
                        `/api/users/${users.populated.id}/recommendations/friends`,
                        {
                            body: {
                                recommendationsAvailable: true,
                                currentReviewCount: 3,
                                minReviewsRequired: 3,
                                recommendations: [1, 2, 3].map((index) => ({
                                    user: {
                                        ...users.suggested,
                                        id: `suggested-${index}`,
                                        firstName:
                                            "AnUnusuallyLongFirstNameForLayoutTesting",
                                        lastName: "Reviewer",
                                    },
                                    similarityScore: 0.8,
                                    sharedMovieCount: 1,
                                    sharedBookCount: 1,
                                    sharedFavoriteItems: [],
                                })),
                            },
                        },
                    );
                }
                await page.goto(
                    kind === "friend"
                        ? `/users/${users.populated.id}/friends`
                        : `/${kind}s`,
                );
                const region = page.getByRole("region", {
                    name: `${kind[0].toUpperCase()}${kind.slice(1)} recommendations`,
                    exact: true,
                });
                const cards = region.locator(".w-76");
                await expect(cards).toHaveCount(3);
                const panelWidth = await region.evaluate(
                    (node) => node.clientWidth,
                );
                for (const card of await cards.all()) {
                    expect(
                        (await card.boundingBox())?.width,
                    ).toBeLessThanOrEqual(panelWidth);
                    expect(
                        await card.evaluate((node) => node.scrollWidth),
                    ).toBeLessThanOrEqual(
                        Math.ceil((await card.boundingBox())?.width ?? 0),
                    );
                }
                const arrows = region
                    .locator("..")
                    .getByRole("button", { name: /^Scroll/ });
                if (width <= 390) {
                    const panel = await region.boundingBox();
                    for (const arrow of await arrows.all()) {
                        const bounds = await arrow.boundingBox();
                        if (panel && bounds)
                            expect(
                                bounds.y + bounds.height,
                            ).toBeLessThanOrEqual(panel.y);
                    }
                }
                const lastLink = cards.last().getByRole("link").first();
                await lastLink.focus();
                await expectUnobscuredFocus(page, lastLink);
                await expectInside(lastLink, region);
                await expectNoPageOverflow(page);
            });
        }
    }
});

// Canvas resolves the browser's rendered OKLCH/SVG colors to sRGB for measurement.
async function contrast(page: Page, first: string, second: string) {
    return page.evaluate(
        ({ first, second }) => {
            const luminance = (color: string) => {
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");
                if (!context)
                    throw new Error("Canvas color conversion is unavailable");
                context.fillStyle = color;
                context.fillRect(0, 0, 1, 1);
                const channels = Array.from(
                    context.getImageData(0, 0, 1, 1).data,
                )
                    .slice(0, 3)
                    .map((value) => value / 255)
                    .map((value) =>
                        value <= 0.04045
                            ? value / 12.92
                            : ((value + 0.055) / 1.055) ** 2.4,
                    );
                return (
                    channels[0] * 0.2126 +
                    channels[1] * 0.7152 +
                    channels[2] * 0.0722
                );
            };
            const a = luminance(first),
                b = luminance(second);
            return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        },
        { first, second },
    );
}

test.describe("Icon and header contrast", () => {
    test.use({ persona: "empty" });
    for (const media of ["books", "movies"] as const) {
        test(`${media} rating and bookmark shapes and selected states have sufficient contrast`, async ({
            page,
            api,
        }) => {
            const item = media === "books" ? books[0] : movies[0];
            api.respond("PUT", `/api/${media}/${item.id}`, { body: {} });
            await page.goto(`/${media}/${item.id}`);
            const stars = page.getByRole("radio");
            await stars.nth(7).press("Space");
            const selected = stars.nth(7).locator("..").locator("svg");
            const unselected = stars.last().locator("..").locator("svg");
            const background = await stars.first().evaluate((node) => {
                let parent = node.parentElement;
                while (
                    parent &&
                    getComputedStyle(parent).backgroundColor ===
                        "rgba(0, 0, 0, 0)"
                )
                    parent = parent.parentElement;
                return parent
                    ? getComputedStyle(parent).backgroundColor
                    : "white";
            });
            const selectedColor = await selected.evaluate(
                (node) => getComputedStyle(node).fill,
            );
            const unselectedColor = await unselected.evaluate(
                (node) => getComputedStyle(node).fill,
            );
            const stroke = await unselected.evaluate(
                (node) => getComputedStyle(node).stroke,
            );
            expect(
                await unselected.evaluate((node) =>
                    Number.parseFloat(getComputedStyle(node).strokeWidth),
                ),
            ).toBeGreaterThan(0);
            expect(
                await contrast(page, selectedColor, background),
            ).toBeGreaterThanOrEqual(3);
            expect(
                await contrast(page, stroke, background),
            ).toBeGreaterThanOrEqual(3);
            expect(
                await contrast(page, selectedColor, unselectedColor),
            ).toBeGreaterThanOrEqual(3);
            const bookmark = page.getByRole("button", {
                name: `Save ${item.title} to wishlist`,
                exact: true,
            });
            const svg = bookmark.locator("svg");
            const emptyColor = await svg.evaluate(
                (node) => getComputedStyle(node).fill,
            );
            expect(
                await contrast(
                    page,
                    await svg.evaluate((node) => getComputedStyle(node).stroke),
                    "white",
                ),
            ).toBeGreaterThanOrEqual(3);
            await bookmark.press("Enter");
            await expect(bookmark).toHaveAttribute("aria-pressed", "true");
            const savedColor = await svg.evaluate(
                (node) => getComputedStyle(node).fill,
            );
            expect(
                await contrast(page, savedColor, emptyColor),
            ).toBeGreaterThanOrEqual(3);
            await bookmark.hover();
            const savedHover = await svg.evaluate(
                (node) => getComputedStyle(node).fill,
            );
            expect(
                await contrast(page, savedHover, "white"),
            ).toBeGreaterThanOrEqual(3);
            await bookmark.press("Enter");
            await expect(bookmark).toHaveAttribute("aria-pressed", "false");
            const unsavedHover = await svg.evaluate(
                (node) => getComputedStyle(node).fill,
            );
            expect(
                await contrast(page, savedHover, unsavedHover),
            ).toBeGreaterThanOrEqual(3);
            await page.emulateMedia({ forcedColors: "active" });
            expect(
                await contrast(
                    page,
                    await selected.evaluate(
                        (node) => getComputedStyle(node).fill,
                    ),
                    await unselected.evaluate(
                        (node) => getComputedStyle(node).fill,
                    ),
                ),
            ).toBeGreaterThanOrEqual(3);
            const forcedEmpty = await svg.evaluate(
                (node) => getComputedStyle(node).fill,
            );
            await bookmark.press("Enter");
            await expect(bookmark).toHaveAttribute("aria-pressed", "true");
            expect(
                await contrast(
                    page,
                    await svg.evaluate((node) => getComputedStyle(node).fill),
                    forcedEmpty,
                ),
            ).toBeGreaterThanOrEqual(3);
        });
    }

    test("header active and hover text remain readable", async ({ page }) => {
        await page.goto("/books");
        const header = page.getByRole("banner");
        await expect(
            header
                .getByRole("link", { name: "Books", exact: true })
                .filter({ visible: true }),
        ).toHaveAttribute("aria-current", "page");
        for (const label of ["Beyond Reviews", "Movies"]) {
            const link = header
                .getByRole("link", { name: label, exact: true })
                .filter({ visible: true });
            await link.hover();
            expect(
                (await analyze(page)).violations.filter(
                    (violation) => violation.id === "color-contrast",
                ),
            ).toEqual([]);
        }
    });
});

test.describe("Narrow pagination", () => {
    test.use({ persona: "empty", viewport: { width: 320, height: 256 } });
    for (const media of ["books", "movies"] as const) {
        const item = media === "books" ? books[0] : movies[0];
        const reviews = media === "books" ? bookReviews : movieReviews;
        test(`${media} wrap paging controls and retain visible focus after changing page`, async ({
            page,
            api,
        }) => {
            const path = `/api/${media}/${item.id}/reviews`;
            const body = {
                ...paginated([reviews[0]], 6),
                reviews: [reviews[0]],
                totalPages: 12,
            };
            api.respond("GET", path, { body });
            await page.goto(`/${media}/${item.id}`);
            const pagination = page.getByRole("navigation", {
                name: "Pagination",
                exact: true,
            });
            const controls = pagination.getByRole("button");
            await expect(pagination).toBeVisible();
            for (const control of await controls.all())
                await expectInside(control, pagination);
            const pageSeven = pagination.getByRole("button", {
                name: "7",
                exact: true,
            });
            api.respond("GET", path, { body: { ...body, currentPage: 7 } });
            await pageSeven.press("Enter");
            await expect(pageSeven).toHaveAttribute("aria-current", "page");
            await expectUnobscuredFocus(page, pageSeven);
            await expectNoPageOverflow(page);
            expect(
                (await analyze(page)).violations.filter(
                    (violation) => violation.id === "color-contrast",
                ),
            ).toEqual([]);
        });
    }
});

test.describe("Catalog hover contrast", () => {
    test.use({ viewport: { width: 390, height: 844 } });
    for (const media of ["books", "movies"] as const) {
        test(`${media} Search and query links retain readable hover colors`, async ({
            page,
        }) => {
            await page.goto(`/${media}`);
            const item = media === "books" ? books[0] : movies[0];
            const list = page.locator("[data-catalog-list]");
            await expect(
                list.getByRole("link", { name: item.title, exact: true }),
            ).toBeVisible();
            const search = page
                .getByRole("search", { name: "Catalog search" })
                .getByRole("button", { name: "Search", exact: true })
                .filter({ visible: true });
            await search.hover();
            expect(
                (await analyze(page)).violations.filter(
                    (violation) => violation.id === "color-contrast",
                ),
            ).toEqual([]);
            await list
                .getByRole("button", { name: "2020", exact: true })
                .hover();
            expect(
                (await analyze(page)).violations.filter(
                    (violation) => violation.id === "color-contrast",
                ),
            ).toEqual([]);
        });
    }
});

test.describe("Catalog grid spacing", () => {
    test.use({ persona: "populated" });
    for (const width of [767, 768, 769, 1024, 1536]) {
        for (const media of ["books", "movies"] as const) {
            test(`${media} cards keep a visible gap at ${width}px`, async ({
                page,
            }) => {
                await page.setViewportSize({ width, height: 900 });
                await page.goto(`/${media}`);
                const cards = page.locator("[data-catalog-list] > li > div");
                await expect(cards).toHaveCount(3);
                await page.evaluate(async () => {
                    await Promise.all(
                        Array.from(document.images, (image) =>
                            image.decode().catch(() => undefined),
                        ),
                    );
                });
                const boxes = await cards.evaluateAll((nodes) =>
                    nodes.map((node) => {
                        const box = node.getBoundingClientRect();
                        return {
                            left: box.left,
                            right: box.right,
                            top: box.top,
                            bottom: box.bottom,
                        };
                    }),
                );
                if (width >= 768)
                    expect(boxes[0].top).toBeCloseTo(boxes[1].top, 1);
                else
                    expect(boxes[1].top).toBeGreaterThanOrEqual(
                        boxes[0].bottom,
                    );
                for (let i = 0; i < boxes.length; i++) {
                    expect(boxes[i].left).toBeGreaterThanOrEqual(0);
                    expect(boxes[i].right).toBeLessThanOrEqual(width);
                    for (let j = i + 1; j < boxes.length; j++) {
                        if (
                            Math.min(boxes[i].bottom, boxes[j].bottom) <=
                            Math.max(boxes[i].top, boxes[j].top)
                        )
                            continue;
                        const gap =
                            boxes[i].left < boxes[j].left
                                ? boxes[j].left - boxes[i].right
                                : boxes[i].left - boxes[j].right;
                        expect(gap).toBeGreaterThanOrEqual(16);
                    }
                }
            });
        }
    }
});
