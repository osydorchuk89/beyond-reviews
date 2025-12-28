import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, it, expect, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import { LoginPage } from "./LoginPage";

const createMockRouter = (actionData?: any) => {
    return createMemoryRouter(
        [
            {
                path: "/login",
                element: <LoginPage />,
                action: async () => actionData ?? null,
            },
        ],
        {
            initialEntries: ["/login"],
        }
    );
};

describe("LoginPage", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders a login form", () => {
        const router = createMockRouter();
        render(<RouterProvider router={router} />);

        const loginForm = screen.getByTestId("login-form");
        expect(loginForm).toBeInTheDocument();
    });

    it("renders email and password input fields", () => {
        const router = createMockRouter();
        render(<RouterProvider router={router} />);

        const emailInput = screen.getByLabelText(/email/i);
        const passwordInput = screen.getByLabelText(/password/i);

        expect(emailInput).toBeInTheDocument();
        expect(passwordInput).toBeInTheDocument();
    });

    it("renders a login button", () => {
        const router = createMockRouter();
        render(<RouterProvider router={router} />);

        const loginButton = screen.getByRole("button", { name: "LOGIN" });
        expect(loginButton).toBeInTheDocument();
        expect(loginButton).not.toBeDisabled();
    });

    it("shows a validation error when submitting empty email", async () => {
        const router = createMockRouter();
        render(<RouterProvider router={router} />);

        const submitButton = screen.getByRole("button", { name: "LOGIN" });
        await userEvent.type(screen.getByLabelText(/password/i), "password");
        await userEvent.click(submitButton);

        expect(
            await screen.findByText(/email is required/i)
        ).toBeInTheDocument();
    });

    it("shows a validation error when submitting empty password", async () => {
        const router = createMockRouter();
        render(<RouterProvider router={router} />);

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

    it("renders a link to the registration page", () => {
        const router = createMockRouter();
        render(<RouterProvider router={router} />);

        const registrationLink = screen.getByText(/Register here/i);
        expect(registrationLink).toBeInTheDocument();
    });

    it("renders 'Login with Google' button", () => {
        const router = createMockRouter();
        render(<RouterProvider router={router} />);

        const googleButton = screen.getByText(/Login with Google/i);
        expect(googleButton).toBeInTheDocument();
    });
});
