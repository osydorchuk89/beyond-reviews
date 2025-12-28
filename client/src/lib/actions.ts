import { ActionFunctionArgs, redirect } from "react-router";

import axiosInstance from "./axiosInstance";
import { getAuthData } from "./api";

// Registration
export const registrationAction = async ({ request }: { request: Request }) => {
    const formData = await request.formData();

    try {
        const response = await axiosInstance.post("/api/users/", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        if (response.status === 200 && response.data) {
            return redirect("/");
        } else {
            return { error: "Registration successful but auto-login failed" };
        }
    } catch (error: any) {
        if (error.response?.status === 409) {
            return { error: "User with this email already exists" };
        }
        return {
            error: error.response?.data?.message ?? "Registration failed",
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
    } catch (error: any) {
        if (error.response?.status === 401) {
            return { error: "Invalid credentials" };
        }
        return { error: error.response?.data?.message ?? "Login failed" };
    }
};

export const logoutAction = async () => {
    try {
        await axiosInstance.get("/auth/logout");
        return null;
    } catch (error: any) {
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
    } catch (error: any) {
        return {
            error: error.response?.data?.message ?? "Failed to submit review",
        };
    }
};
