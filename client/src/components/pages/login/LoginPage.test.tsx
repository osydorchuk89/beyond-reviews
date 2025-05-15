import { Provider } from "react-redux";
import { MemoryRouter } from "react-router";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import { LoginPage } from "./LoginPage";
import { store } from "../../../store";
import { sendLoginData } from "../../../lib/actions";

const navigateMock = vi.fn();
vi.mock("react-router", async () => {
    const actual = await vi.importActual("react-router");
    return {
        ...actual,
        useNavigate: vi.fn(() => navigateMock),
    };
});

vi.mock("../../../lib/actions", () => ({
    sendLoginData: vi.fn(),
}));

describe("LoginPage", () => {
    beforeEach(() => {
        render(
            <Provider store={store}>
                <MemoryRouter>
                    <LoginPage />
                </MemoryRouter>
            </Provider>
        );
    });

    afterEach(() => {
        cleanup();
    });

    it("renders a login form", () => {
        const loginForm = screen.getByTestId("login-form");
        expect(loginForm).toBeInTheDocument();
    });

    it("shows a validation error when submitting empty email", async () => {
        const submitButton = screen.getByRole("button", { name: "LOGIN" });
        await userEvent.type(screen.getByLabelText(/password/i), "password");
        await userEvent.click(submitButton);

        expect(
            await screen.findByText(/email is required/i)
        ).toBeInTheDocument();
    });

    it("shows a validation error when submitting empty password", async () => {
        const submitButton = screen.getByRole("button", { name: "LOGIN" });
        await userEvent.type(
            screen.getByLabelText(/email/i),
            "john.doe@email.com"
        );
        await userEvent.click(submitButton);

        expect(
            await screen.findByText(/password is required/i)
        ).toBeInTheDocument();
    });

    it("disables login button and shows 'Please wait...' when submitting login data", async () => {
        vi.mocked(sendLoginData).mockImplementationOnce(() => {
            return new Promise((resolve) =>
                setTimeout(() => resolve({ status: 200 }), 100)
            );
        });

        const submitButton = screen.getByRole("button", { name: "LOGIN" });

        expect(submitButton).not.toBeDisabled();

        await userEvent.type(
            screen.getByLabelText(/email/i),
            "john.doe@email.com"
        );
        await userEvent.type(screen.getByLabelText(/password/i), "password");

        await userEvent.click(submitButton);

        expect(submitButton).toBeDisabled();

        expect(submitButton).toHaveTextContent("Please wait...");
    });

    it("shows 'Invalid credentials' message on failed login attempt", async () => {
        vi.mocked(sendLoginData).mockImplementationOnce(() => {
            return new Promise((resolve) =>
                setTimeout(() => resolve({ status: 401 }), 100)
            );
        });

        await userEvent.type(
            screen.getByLabelText(/email/i),
            "wrong@email.com"
        );
        await userEvent.type(
            screen.getByLabelText(/password/i),
            "wrongpassword"
        );

        await userEvent.click(screen.getByRole("button", { name: "LOGIN" }));

        expect(
            await screen.findByText(/Invalid credentials/i)
        ).toBeInTheDocument();
    });

    it("removes 'Invalid credentials' message when a close icon is clicked", async () => {
        vi.mocked(sendLoginData).mockImplementationOnce(() => {
            return new Promise((resolve) =>
                setTimeout(() => resolve({ status: 401 }), 100)
            );
        });

        await userEvent.type(
            screen.getByLabelText(/email/i),
            "wrong@email.com"
        );
        await userEvent.type(
            screen.getByLabelText(/password/i),
            "wrongpassword"
        );

        await userEvent.click(screen.getByRole("button", { name: "LOGIN" }));

        const errorMessage = await screen.findByText(/Invalid credentials/i);
        expect(errorMessage).toBeInTheDocument();

        const closeButton = screen.getByTestId("close-button");
        await userEvent.click(closeButton);

        expect(
            screen.queryByText(/Invalid credentials/i)
        ).not.toBeInTheDocument();
    });

    it("navigates back upon successful login", async () => {
        vi.mocked(sendLoginData).mockImplementationOnce(() => {
            return new Promise((resolve) =>
                setTimeout(() => resolve({ status: 200 }), 500)
            );
        });

        await userEvent.type(
            screen.getByLabelText(/email/i),
            "user@example.com"
        );
        await userEvent.type(
            screen.getByLabelText(/password/i),
            "securepassword"
        );

        await userEvent.click(screen.getByRole("button", { name: "LOGIN" }));

        expect(navigateMock).toHaveBeenCalledWith(-1);
    });
});
