import { test, expect } from "./fixtures";
import {
    books,
    movies,
    bookReviews,
    movieReviews,
    paginated,
    users,
} from "./data";
import { scan } from "./scan";

// These journeys join the existing focused checks using synthetic API responses.
// Controls are located by their accessible names and activated with the keyboard;
// real screen-reader speech, OAuth and backend integration require manual checks.
for (const media of ["books", "movies"] as const) {
    test(`${media}: search, sign in after failure, review, save, revisit and sign out`, async ({
        page,
        api,
    }, info) => {
        const item = media === "books" ? books[0] : movies[0];
        const singular = media === "books" ? "book" : "movie";
        const detailPath = `/${media}/${item.id}`;
        const reviewsPath = `/api${detailPath}/reviews`;
        const user = users.empty;

        await page.goto("/");
        await page
            .getByRole("navigation", { name: "Primary navigation" })
            .getByRole("link", {
                name: media === "books" ? "Books" : "Movies",
                exact: true,
            })
            .press("Enter");
        await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
        const search = page.getByLabel("Search", { exact: true });
        await search.focus();
        await search.pressSequentially(media === "books" ? "Quiet" : "Open");
        await search.press("Enter");
        await expect(page).toHaveURL(/search=/);
        await page
            .getByRole("link", { name: item.title, exact: true })
            .press("Enter");
        await expect(
            page.getByRole("heading", {
                level: 1,
                name: item.title,
                exact: true,
            }),
        ).toBeFocused();
        await page
            .locator("header")
            .getByRole("link", { name: "LOGIN", exact: true })
            .press("Enter");
        const email = page.getByLabel("Email:", { exact: true });
        const password = page.getByLabel("Password:", { exact: true });
        await email.focus();
        await email.pressSequentially(user.email);
        await password.focus();
        await password.pressSequentially("Synthetic-password-123!");
        const login = page.getByRole("button", { name: "LOGIN", exact: true });
        api.respond("POST", "/auth/login", { status: 401, body: {} });
        await login.press("Enter");
        await expect(page.getByRole("alert")).toHaveText("Invalid credentials");
        await expect(login).toBeFocused();
        await expect(email).toHaveValue(user.email);
        api.respond("POST", "/auth/login", { body: {} });
        api.respond("GET", "/auth/status", {
            body: { isAuthenticated: true, user },
        });
        await login.press("Enter");
        await expect(page).toHaveURL(detailPath);
        await expect(
            page.getByRole("heading", {
                level: 1,
                name: item.title,
                exact: true,
            }),
        ).toBeFocused();

        const form = page.getByRole("form", {
            name: `Your ${singular} review`,
        });
        const firstStar = form.getByRole("radio", {
            name: "1 out of 10",
            exact: true,
        });
        await firstStar.press("Space");
        for (let index = 0; index < 7; index++)
            await page.keyboard.press("ArrowRight");
        await expect(
            form.getByRole("radio", { name: "8 out of 10", exact: true }),
        ).toBeChecked();
        const text = form.getByLabel("Post your review (optional):", {
            exact: true,
        });
        await text.focus();
        await text.pressSequentially(
            "A review saved during the complete journey.",
        );
        const review = {
            ...(media === "books" ? bookReviews[0] : movieReviews[0]),
            user,
            userId: user.id,
            rating: 8,
            text: "A review saved during the complete journey.",
        };
        api.respond("POST", reviewsPath, { body: {} });
        api.respond("GET", reviewsPath, {
            body: {
                ...paginated([review]),
                reviews: [review],
                userReview: review,
            },
        });
        await form
            .getByRole("button", { name: "SUBMIT", exact: true })
            .press("Enter");
        await expect(
            page.getByRole("button", { name: "EDIT YOUR REVIEW", exact: true }),
        ).toBeFocused();

        api.respond("PUT", `/api${detailPath}`, { body: {} });
        await page
            .getByRole("button", {
                name: `Save ${item.title} to wishlist`,
                exact: true,
            })
            .press("Enter");
        await expect(
            page.getByRole("button", {
                name: `Save ${item.title} to wishlist`,
                exact: true,
            }),
        ).toHaveAttribute("aria-pressed", "true");
        api.respond("GET", `/api${detailPath}`, {
            body: { ...item, onWishlist: [{ userId: user.id }] },
        });
        api.respond("GET", `/api/users/${user.id}/wishlist`, {
            body: {
                books:
                    media === "books"
                        ? [
                              {
                                  id: "journey-saved",
                                  userId: user.id,
                                  bookId: item.id,
                                  book: item,
                              },
                          ]
                        : [],
                movies:
                    media === "movies"
                        ? [
                              {
                                  id: "journey-saved",
                                  userId: user.id,
                                  movieId: item.id,
                                  movie: item,
                              },
                          ]
                        : [],
                albums: [],
            },
        });
        await page
            .getByRole("link", {
                name: "Your profile: Sam Newcomer",
                exact: true,
            })
            .press("Enter");
        await page
            .getByRole("navigation", { name: "Profile", exact: true })
            .getByRole("link", { name: "Wishlist", exact: true })
            .press("Enter");
        if (media === "movies")
            await page
                .getByRole("tab", { name: "Movies", exact: true })
                .press("Enter");
        await page
            .getByRole("tabpanel")
            .getByRole("link", { name: item.title, exact: true })
            .press("Enter");
        await expect(
            page.getByRole("heading", {
                level: 1,
                name: item.title,
                exact: true,
            }),
        ).toBeFocused();
        await expect(
            page.getByText(review.text, { exact: true }).first(),
        ).toBeVisible();
        await page.goBack();
        await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
        await page.goForward();
        await expect(
            page.getByRole("heading", {
                level: 1,
                name: item.title,
                exact: true,
            }),
        ).toBeFocused();
        await scan(page, info, `journey-${media}-saved`);
        api.respond("POST", "/auth/logout", { body: {} });
        api.respond("GET", "/auth/status", {
            body: { isAuthenticated: false },
        });
        await page
            .getByRole("button", { name: "LOGOUT", exact: true })
            .press("Enter");
        await expect(
            page
                .locator("header")
                .getByRole("link", { name: "LOGIN", exact: true }),
        ).toBeVisible();
        await expect(
            page.getByRole("form", { name: `Your ${singular} review` }),
        ).toHaveCount(0);
    });
}

test.describe("Social journey", () => {
    test.use({ persona: "populated" });

    test("accept a request, visit the friend and return, then send a request after failure", async ({
        page,
        api,
    }, info) => {
        const user = users.populated;
        api.respond("GET", `/api/users/${user.id}/recommendations/friends`, {
            body: {
                recommendationsAvailable: true,
                currentReviewCount: 3,
                minReviewsRequired: 3,
                recommendations: [
                    {
                        user: users.empty,
                        similarityScore: 0.8,
                        sharedMovieCount: 1,
                        sharedBookCount: 0,
                        sharedFavoriteItems: [],
                        sharedFavoriteTitles: [],
                    },
                ],
            },
        });
        await page.goto(`/users/${user.id}/profile`);
        await page
            .getByRole("navigation", { name: "Profile", exact: true })
            .getByRole("link", { name: "Friends", exact: true })
            .press("Enter");
        const accept = page.getByRole("button", {
            name: "Accept friend request from Casey Requester",
            exact: true,
        });
        api.respond("POST", `/api/users/${user.id}/friends`, { body: {} });
        await accept.press("Enter");
        const friend = page.locator(`[data-friend-id="${users.received.id}"]`);
        await expect(friend).toBeFocused();
        // Reflect the confirmed backend result on the next loader request.
        api.respond("GET", `/api/users/${user.id}`, {
            body: {
                ...user,
                receivedFriendRequests: [],
                friends: [...user.friends, users.received],
            },
        });
        api.respond("GET", `/api/users/${users.received.id}`, {
            body: { ...users.received, friends: [user] },
        });
        await friend.press("Enter");
        await expect(
            page.getByRole("heading", {
                level: 1,
                name: "Casey Requester — Profile",
                exact: true,
            }),
        ).toBeFocused();
        await page.goBack();
        await expect(
            page.locator(`[data-friend-id="${users.received.id}"]`),
        ).toBeVisible();
        await expect(accept).toHaveCount(0);
        await page
            .getByRole("link", { name: "Sam Newcomer", exact: true })
            .press("Enter");
        const send = page.getByRole("button", {
            name: "SEND FRIEND REQUEST",
            exact: true,
        });
        api.respond("POST", `/api/users/${user.id}/friend-requests`, {
            status: 500,
            body: {},
        });
        await send.press("Enter");
        await expect(
            page
                .getByRole("alert")
                .filter({ hasText: "Could not send the friend request" }),
        ).toBeVisible();
        await expect(send).toBeFocused();
        api.respond("POST", `/api/users/${user.id}/friend-requests`, {
            body: {},
        });
        await send.press("Enter");
        await expect(
            page.getByRole("button", {
                name: "FRIEND REQUEST SENT",
                exact: true,
            }),
        ).toBeFocused();
        await scan(page, info, "journey-friend-request-sent");
    });
});
