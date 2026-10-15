// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { getWishlistKey, useWishlistStore } from ".";

const originalKey = getWishlistKey("Book", "item-1", "user-1");

afterEach(() => {
    useWishlistStore.setState({ selection: null });
});

describe("Wishlist requests", () => {
    it("prevents duplicate requests and only changes selection after success", async () => {
        const store = useWishlistStore.getState();
        store.initialize(originalKey, false);
        let finish = () => {};
        const save = vi.fn(
            () =>
                new Promise<void>((resolve) => {
                    finish = resolve;
                }),
        );

        const request = store.toggle(originalKey, save);
        await store.toggle(originalKey, save);
        expect(save).toHaveBeenCalledExactlyOnceWith(false);
        expect(useWishlistStore.getState().selection).toMatchObject({
            hasSaved: false,
            isPending: true,
        });

        finish();
        expect(await request).toBe(true);
        expect(useWishlistStore.getState().selection).toMatchObject({
            hasSaved: true,
            isPending: false,
            status: "",
            error: "",
        });
    });

    it("retains the saved state on failure and clears the error after a successful retry", async () => {
        const store = useWishlistStore.getState();
        store.initialize(originalKey, true);
        expect(
            await store.toggle(originalKey, async () => {
                throw new Error("Unavailable");
            }),
        ).toBeUndefined();
        expect(useWishlistStore.getState().selection).toMatchObject({
            hasSaved: true,
            isPending: false,
            error: "Could not update your wishlist. Try again.",
        });

        expect(await store.toggle(originalKey, async () => {})).toBe(false);
        expect(useWishlistStore.getState().selection).toMatchObject({
            hasSaved: false,
            isPending: false,
            status: "",
            error: "",
        });
    });

    for (const [scenario, nextKey] of [
        ["another item", getWishlistKey("Book", "item-2", "user-1")],
        ["another media type", getWishlistKey("Movie", "item-1", "user-1")],
        ["another account", getWishlistKey("Book", "item-1", "user-2")],
        ["the same item reopened", originalKey],
    ]) {
        for (const fails of [false, true]) {
            it(`ignores a late ${fails ? "failure" : "success"} after opening ${scenario}`, async () => {
                const store = useWishlistStore.getState();
                store.initialize(originalKey, true);
                let finish = () => {};
                const request = store.toggle(
                    originalKey,
                    () =>
                        new Promise<void>((resolve, reject) => {
                            finish = () =>
                                fails
                                    ? reject(new Error("Unavailable"))
                                    : resolve();
                        }),
                );

                store.clear(originalKey);
                store.initialize(nextKey, false);
                finish();

                expect(await request).toBeUndefined();
                expect(useWishlistStore.getState().selection).toMatchObject({
                    key: nextKey,
                    hasSaved: false,
                    isPending: false,
                    status: "",
                    error: "",
                });
            });
        }
    }
});
