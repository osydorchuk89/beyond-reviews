import { type ActionFunctionArgs, redirect } from "react-router";
import { isAxiosError } from "axios";

import axiosInstance from "./axiosInstance";
import { getAuthData } from "./api";

const getErrorMessage = (error: unknown, fallback: string): string => {
    if (isAxiosError<{ message?: unknown }>(error)) {
        const message = error.response?.data?.message;
        if (typeof message === "string") return message;
    }
    return fallback;
};

// Registration
export const registrationAction = async ({ request }: { request: Request }) => {
    const formData = await request.formData();

    try {
        const response = await axiosInstance.post("/api/users/", formData);

        if (response.status === 200 && response.data) {
            return redirect("/");
        } else {
            return { error: "Registration successful but auto-login failed" };
        }
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 409) {
            return { error: "User with this email already exists" };
        }
        return {
            error: getErrorMessage(error, "Registration failed"),
        };
    }
};

// Authentification
export const loginAction = async ({ request }: { request: Request }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const from = (formData.get("from") as string) ?? "/";

    try {
        await axiosInstance.post("/auth/login", {
            email,
            password,
        });
        return redirect(from);
    } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
            return { error: "Invalid credentials" };
        }
        return { error: getErrorMessage(error, "Login failed") };
    }
};

export const logoutAction = async () => {
    try {
        await axiosInstance.post("/auth/logout");
        return null;
    } catch {
        return { error: "Logout failed" };
    }
};

// Movie reviews
export const movieReviewAction = async ({
    params,
    request,
}: ActionFunctionArgs) => {
    const { movieId } = params;

    const authData = await getAuthData();
    const userId = authData?.user?.id;

    const formData = await request.formData();
    const rating = Number(formData.get("rating"));
    const text = formData.get("text");
    const date = new Date();

    try {
        await axiosInstance.post(`/api/movies/${movieId}/reviews`, {
            movieId,
            userId,
            rating,
            text,
            date,
        });
        return { success: true };
    } catch (error) {
        return {
            error: getErrorMessage(error, "Failed to submit review"),
        };
    }
};

export const bookReviewAction = async ({
    params,
    request,
}: ActionFunctionArgs) => {
    const { bookId } = params;

    const authData = await getAuthData();
    const userId = authData?.user?.id;

    const formData = await request.formData();
    const rating = Number(formData.get("rating"));
    const text = formData.get("text");
    const date = new Date();

    try {
        await axiosInstance.post(`/api/books/${bookId}/reviews`, {
            bookId,
            userId,
            rating,
            text,
            date,
        });
        return { success: true };
    } catch (error) {
        return {
            error: getErrorMessage(error, "Failed to submit review"),
        };
    }
};
