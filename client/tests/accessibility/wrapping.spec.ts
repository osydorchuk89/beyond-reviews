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

const longName =
    "AnUnusuallyLongNameWithoutAnySpacesForResponsiveLayoutTesting";
const longReview = longName.repeat(4);
const prefix = `/users/${users.populated.id}`;

async function prepare(page: Page, path: string, spaced: boolean) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    if (spaced) {
        await page.addStyleTag({
            content: `
            * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; }
            p { margin-bottom: 2em !important; }
        `,
        });
    }
}

async function expectNoOverflow(page: Page) {
    await expect(page.locator(".animate-pulse")).toHaveCount(0);
    const dimensions = await page.evaluate(() => ({
        content: document.documentElement.scrollWidth,
        viewport: document.documentElement.clientWidth,
    }));
    expect(dimensions.content).toBe(dimensions.viewport);
}

for (const spaced of [false, true]) {
    test.describe(
        spaced ? "Long content with increased text spacing" : "Long content",
        () => {
            test.use({
                persona: "populated",
                viewport: { width: 320, height: 900 },
            });

            for (const media of ["books", "movies"] as const) {
                test(`${media} filter chips fit and keep usable removal controls and focus`, async ({
                    page,
                }) => {
                    const param = media === "books" ? "author" : "director";
                    const label = media === "books" ? "Author" : "Director";
                    const query = new URLSearchParams({
                        genre: media === "books" ? "Fiction" : "Drama",
                        releaseYear: "2020",
                        [param]: longName,
                        search: media === "books" ? "Quiet" : "Open",
                    });
                    if (media === "movies") query.set("actor", longName);
                    await prepare(page, `/${media}?${query}`, spaced);
                    const remove = page.getByRole("button", {
                        name: `Remove ${label}: ${longName}`,
                        exact: true,
                    });
                    await expect(remove).toBeVisible();
                    const controls = page.getByRole("button", {
                        name: /^Remove /,
                    });
                    await expect(controls).toHaveCount(
                        media === "books" ? 4 : 5,
                    );
                    for (const control of await controls.all()) {
                        const box = await control.boundingBox();
                        expect(box).not.toBeNull();
                        if (!box) continue;
                        expect(box.width).toBeGreaterThanOrEqual(24);
                        expect(box.height).toBeGreaterThanOrEqual(24);
                        expect(box.x).toBeGreaterThanOrEqual(0);
                        expect(box.x + box.width).toBeLessThanOrEqual(320);
                    }
                    await expectNoOverflow(page);
                    await remove.press("Enter");
                    await expect(
                        page.getByLabel("Search", { exact: true }),
                    ).toBeFocused();
                    await expect(page).not.toHaveURL(new RegExp(`${param}=`));
                    await expectNoOverflow(page);
                });

                test(`${media} detail titles, credits and reviews wrap without page overflow`, async ({
                    page,
                    api,
                }) => {
                    const original = media === "books" ? books[0] : movies[0];
                    const originalReview =
                        media === "books" ? bookReviews[0] : movieReviews[0];
                    const item = {
                        ...original,
                        title: longName,
                        overview: longReview,
                        ...(media === "books"
                            ? { authors: [longName] }
                            : { director: longName, cast: [longName] }),
                    };
                    const review = {
                        ...originalReview,
                        text: longReview,
                        user: {
                            ...users.populated,
                            firstName: longName,
                            lastName: longName,
                        },
                    };
                    api.respond("GET", `/api/${media}/${item.id}`, {
                        body: item,
                    });
                    api.respond("GET", `/api/${media}/${item.id}/reviews`, {
                        body: {
                            ...paginated([review]),
                            reviews: [review],
                            userReview: review,
                        },
                    });
                    await prepare(page, `/${media}/${item.id}`, spaced);
                    await expect(
                        page.getByRole("heading", {
                            level: 1,
                            name: longName,
                            exact: true,
                        }),
                    ).toBeVisible();
                    await expect(
                        page.getByText(longReview, { exact: true }).first(),
                    ).toBeVisible();
                    await expectNoOverflow(page);
                });

                test(`${media} profile reviews keep long titles and text within the page`, async ({
                    page,
                    api,
                }) => {
                    const review =
                        media === "books"
                            ? {
                                  ...bookReviews[0],
                                  text: longReview,
                                  book: { ...books[0], title: longName },
                              }
                            : {
                                  ...movieReviews[0],
                                  text: longReview,
                                  movie: { ...movies[0], title: longName },
                              };
                    api.respond(
                        "GET",
                        `/api${prefix}/${media === "books" ? "book" : "movie"}-reviews`,
                        { body: { ...paginated([review]), reviews: [review] } },
                    );
                    await prepare(page, `${prefix}/reviews`, spaced);
                    if (media === "movies")
                        await page
                            .getByRole("tab", { name: "Movies", exact: true })
                            .press("Enter");
                    await expect(
                        page.getByText(`Review: ${longReview}`, {
                            exact: true,
                        }),
                    ).toBeVisible();
                    await expectNoOverflow(page);
                });
            }

            for (const section of ["profile", "friends"] as const) {
                test(`${section} keep long profile and friend names within the page`, async ({
                    page,
                    api,
                }) => {
                    api.respond("GET", `/api${prefix}`, {
                        body: {
                            ...users.populated,
                            firstName: longName,
                            lastName: longName,
                            friends: [
                                {
                                    ...users.friend,
                                    firstName: longName,
                                    lastName: longName,
                                },
                            ],
                            receivedFriendRequests:
                                users.populated.receivedFriendRequests.map(
                                    (request) => ({
                                        ...request,
                                        sentUser: {
                                            ...request.sentUser,
                                            firstName: longName,
                                            lastName: longName,
                                        },
                                    }),
                                ),
                        },
                    });
                    await prepare(page, `${prefix}/${section}`, spaced);
                    await expect(
                        page.getByRole("heading", { level: 1 }),
                    ).toContainText(longName);
                    if (section === "friends")
                        await expect(
                            page.getByRole("heading", {
                                name: "Suggested friends",
                                exact: true,
                            }),
                        ).toBeVisible();
                    await expectNoOverflow(page);
                });
            }

            test("activity titles and reviews wrap within the page", async ({
                page,
                api,
            }) => {
                const activity = {
                    id: "long-activity",
                    userId: users.populated.id,
                    user: users.populated,
                    bookId: books[0].id,
                    book: { ...books[0], title: longName },
                    action: "rated",
                    reviewRating: 8,
                    reviewText: longReview,
                    date: "2026-10-01T12:00:00.000Z",
                };
                api.respond("GET", `/api${prefix}/activities`, {
                    body: { ...paginated([activity]), activities: [activity] },
                });
                await prepare(page, `${prefix}/activities`, spaced);
                await expect(
                    page.getByText(`Review: ${longReview}`, { exact: true }),
                ).toBeVisible();
                await expectNoOverflow(page);
            });
        },
    );
}
