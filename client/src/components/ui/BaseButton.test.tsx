import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BaseButton } from "./BaseButton";

afterEach(cleanup);

describe("buttons inside forms", () => {
    it("only submits when the button explicitly requests submission", async () => {
        const submitted = vi.fn();
        render(
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    submitted();
                }}
            >
                <BaseButton style="sky">Cancel</BaseButton>
                <BaseButton style="orange" type="submit">
                    Save
                </BaseButton>
            </form>,
        );
        const user = userEvent.setup();
        await user.click(screen.getByRole("button", { name: "Cancel" }));
        expect(submitted).not.toHaveBeenCalled();
        await user.click(screen.getByRole("button", { name: "Save" }));
        expect(submitted).toHaveBeenCalledOnce();
    });
});
