import { NextFunction, Request, Response } from "express";
import { BASE_CLIENT_URL } from "../config/constants";

export const login = (req: Request, res: Response) => {
    res.send(req.user);
};

export const getAuthStatus = (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        res.send({ isAuthenticated: true, user: req.user });
    } else {
        res.send({ isAuthenticated: false });
    }
};

export const logout = (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.send("Logged out");
    });
};

export const googleCallback = (req: Request, res: Response) => {
    let redirectPath = "/movies";

    // Extract the 'from' parameter from the OAuth state
    if (req.query.state) {
        try {
            const state = JSON.parse(req.query.state as string);
            if (state.from) {
                // Validate redirect path to prevent open redirect attacks
                const requestedPath = state.from;

                // Only allow relative paths that start with /
                // Reject any path containing protocol schemes or domain names
                if (
                    typeof requestedPath === "string" &&
                    requestedPath.startsWith("/") &&
                    !requestedPath.startsWith("//") &&
                    !/^(\/\\|https?:\/\/|javascript:)/i.test(requestedPath)
                ) {
                    redirectPath = requestedPath;
                }
            }
        } catch (err) {
            // If state parsing fails, use default redirect
            console.error("Failed to parse OAuth state:", err);
        }
    }

    res.redirect(BASE_CLIENT_URL + redirectPath);
};
