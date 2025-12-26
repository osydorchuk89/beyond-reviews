import { Router } from "express";
import passport from "passport";

import {
    getAuthStatus,
    googleCallback,
    login,
    logout,
} from "../controllers/authController";
import { BASE_CLIENT_URL } from "../config/constants";

export const authRouter = Router();

authRouter.post("/login", passport.authenticate("local"), login);

authRouter.get("/status", getAuthStatus);

authRouter.get("/logout", logout);

authRouter.get("/google", (req, res, next) => {
    const from = req.query.from || "/";
    passport.authenticate("google", {
        state: JSON.stringify({ from }),
    })(req, res, next);
});

authRouter.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: BASE_CLIENT_URL + "/login",
    }),
    googleCallback
);
