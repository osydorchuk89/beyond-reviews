// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ActionFunctionArgs } from "react-router";
import { bookReviewAction, movieReviewAction } from "./actions";
import axiosInstance from "./axiosInstance";
import { getAuthData } from "./api";

vi.mock("./axiosInstance", () => ({ default: { post: vi.fn() } }));
vi.mock("./api", () => ({ getAuthData: vi.fn() }));
afterEach(() => vi.resetAllMocks());

describe.each([
    { media: "books", action: bookReviewAction, params: { bookId: "book-1" } },
    {
        media: "movies",
        action: movieReviewAction,
        params: { movieId: "movie-1" },
    },
])("$media review action", ({ action, params }) => {
    for (const rating of ["", "0", "11", "3.5", "invalid"]) {
        it(`rejects an invalid rating (${rating || "missing"}) before any API request`, async () => {
            const request = new Request("http://localhost/review", {
                method: "POST",
                body: new URLSearchParams({ rating, text: "Preserve draft" }),
            });
            const args: ActionFunctionArgs = {
                params,
                request,
                context: {},
                unstable_pattern: "/review",
            };
            const result = await action(args);
            expect(result).toHaveProperty("error");
            expect(getAuthData).not.toHaveBeenCalled();
            expect(axiosInstance.post).not.toHaveBeenCalled();
        });
    }
});
