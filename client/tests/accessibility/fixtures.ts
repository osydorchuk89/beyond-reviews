import { test as base, expect, type Page } from "@playwright/test";
import {
    books,
    movies,
    bookReviews,
    movieReviews,
    paginated,
    users,
} from "./data";

export type Persona = "anonymous" | "empty" | "populated";

interface MockResponse {
    status?: number;
    body: unknown;
}

export class MockApi {
    readonly unexpectedRequests: string[] = [];
    readonly requests: string[] = [];
    private readonly responses = new Map<string, MockResponse>();

    constructor(readonly persona: Persona) {}

    respond(method: string, path: string, response: MockResponse) {
        this.responses.set(`${method} ${path}`, response);
    }

    async install(page: Page) {
        await page.context().route("**/*", async (route) => {
            const request = route.request();
            const url = new URL(request.url());
            const path = url.pathname.replace(/\/$/, "");
            const key = `${request.method()} ${path}`;

            if (path.startsWith("/auth/") || path.startsWith("/api/")) {
                this.requests.push(key);
                const response =
                    this.responses.get(key) ??
                    this.getResponse(url, request.method());
                if (!response) {
                    this.unexpectedRequests.push(key);
                    await route.abort("blockedbyclient");
                    return;
                }
                await route.fulfill({
                    status: response.status ?? 200,
                    json: response.body,
                });
                return;
            }

            // Keep images deterministic and prevent requests to poster/avatar services.
            if (request.resourceType() === "image") {
                await route.fulfill({
                    contentType: "image/svg+xml",
                    body: '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="360"><rect width="240" height="360" fill="#334155"/></svg>',
                });
                return;
            }

            if (url.origin === "http://127.0.0.1:5174") {
                await route.continue();
                return;
            }
            this.unexpectedRequests.push(key);
            await route.abort("blockedbyclient");
        });
    }

    private getResponse(url: URL, method: string): MockResponse | undefined {
        const path = url.pathname.replace(/\/$/, "");
        if (method !== "GET") return undefined;
        const currentUser =
            this.persona === "anonymous" ? undefined : users[this.persona];
        if (path === "/auth/status") {
            return {
                body: {
                    isAuthenticated: Boolean(currentUser),
                    user: currentUser,
                },
            };
        }

        const page = Number(url.searchParams.get("page") ?? 1);
        for (const mediaType of ["books", "movies"] as const) {
            const items = mediaType === "books" ? books : movies;
            const reviews = mediaType === "books" ? bookReviews : movieReviews;
            if (path === `/api/${mediaType}`) {
                const search =
                    url.searchParams.get("search")?.toLowerCase() ?? "";
                const genre = url.searchParams.get("genre");
                const matches = items.filter(
                    (item) =>
                        item.title.toLowerCase().includes(search) &&
                        (!genre || item.genres.includes(genre)),
                );
                return {
                    body: {
                        ...paginated(matches, page),
                        [mediaType]: matches,
                        appliedFilters: Object.fromEntries(url.searchParams),
                    },
                };
            }
            const item = items.find(
                (item) => path === `/api/${mediaType}/${item.id}`,
            );
            if (item) return { body: item };
            const reviewItem = items.find(
                (item) => path === `/api/${mediaType}/${item.id}/reviews`,
            );
            if (reviewItem) {
                const itemReviews = reviews.filter((review) =>
                    mediaType === "books"
                        ? "bookId" in review && review.bookId === reviewItem.id
                        : "movieId" in review &&
                          review.movieId === reviewItem.id,
                );
                return {
                    body: {
                        ...paginated(itemReviews, page),
                        reviews: itemReviews,
                        userReview:
                            currentUser?.id === users.populated.id
                                ? itemReviews[0]
                                : null,
                    },
                };
            }
        }

        for (const user of Object.values(users)) {
            const prefix = `/api/users/${user.id}`;
            const populated = user.id === users.populated.id;
            if (path === prefix) return { body: user };
            if (path === `${prefix}/friends`) return { body: user.friends };
            if (path === `${prefix}/wishlist`) {
                return {
                    body: {
                        books: populated
                            ? [
                                  {
                                      id: "saved-book",
                                      userId: user.id,
                                      bookId: books[0].id,
                                      book: books[0],
                                  },
                              ]
                            : [],
                        movies: populated
                            ? [
                                  {
                                      id: "saved-movie",
                                      userId: user.id,
                                      movieId: movies[0].id,
                                      movie: movies[0],
                                  },
                              ]
                            : [],
                        albums: [],
                    },
                };
            }
            for (const mediaType of ["books", "movies"] as const) {
                const reviews = populated
                    ? mediaType === "books"
                        ? bookReviews
                        : movieReviews
                    : [];
                const singular = mediaType === "books" ? "book" : "movie";
                if (path === `${prefix}/${singular}-reviews`) {
                    return { body: { ...paginated(reviews, page), reviews } };
                }
                if (path === `${prefix}/recommendations/${mediaType}`) {
                    const items = mediaType === "books" ? books : movies;
                    return {
                        body: {
                            recommendationsAvailable: populated,
                            currentReviewCount: reviews.length,
                            minReviewsRequired: 3,
                            recommendations: populated
                                ? items.map((item) => ({
                                      [singular]: item,
                                      score: 0.8,
                                      recommendedByCount: 2,
                                  }))
                                : [],
                        },
                    };
                }
            }
            if (path === `${prefix}/activities`) {
                const tab = url.searchParams.get("tab") ?? "books";
                const activities =
                    !populated || tab === "albums"
                        ? []
                        : [
                              {
                                  id: `activity-${tab}`,
                                  userId: user.id,
                                  user,
                                  ...(tab === "movies"
                                      ? {
                                            movie: movies[0],
                                            movieId: movies[0].id,
                                        }
                                      : {
                                            book: books[0],
                                            bookId: books[0].id,
                                        }),
                                  action: "rated",
                                  reviewRating: 8,
                                  reviewText: "Fixture activity review.",
                                  date: "2026-10-01T12:00:00.000Z",
                              },
                          ];
                return { body: { ...paginated(activities, page), activities } };
            }
            if (path === `${prefix}/recommendations/friends`) {
                return {
                    body: {
                        recommendationsAvailable: populated,
                        currentReviewCount: populated ? 3 : 0,
                        minReviewsRequired: 3,
                        recommendations: populated
                            ? [
                                  {
                                      user: users.suggested,
                                      similarityScore: 0.8,
                                      sharedMovieCount: 1,
                                      sharedBookCount: 1,
                                      sharedFavoriteItems: [
                                          {
                                              id: books[0].id,
                                              mediaType: "BOOK",
                                              title: books[0].title,
                                          },
                                      ],
                                      sharedFavoriteTitles: [books[0].title],
                                  },
                              ]
                            : [],
                    },
                };
            }
        }
        return undefined;
    }
}

export const test = base.extend<{ api: MockApi; persona: Persona }>({
    persona: ["anonymous", { option: true }],
    api: [
        async ({ page, persona }, use) => {
            const api = new MockApi(persona);
            const pageErrors: string[] = [];
            page.on("pageerror", (error) => pageErrors.push(error.message));
            await api.install(page);
            await use(api);
            expect(
                api.unexpectedRequests,
                "Add explicit fixtures for unexpected requests; never use a real API",
            ).toEqual([]);
            expect(
                pageErrors,
                "The test must render application content without crashing",
            ).toEqual([]);
        },
        { auto: true },
    ],
});

export { expect };
