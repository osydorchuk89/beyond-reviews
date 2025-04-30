import { Router } from "express";
import passport from "passport";

const BASE_CLIENT_URL =
    process.env.NODE_ENV === "production"
        ? "https://beyond-reviews-smoc.onrender.com"
        : "http://localhost:5173";

export const authRouter = Router();

authRouter.post("/login", passport.authenticate("local"), (req, res) => {
    res.send(req.user);
});

authRouter.get("/status", (req, res) => {
    if (req.isAuthenticated()) {
        res.send({ isAuthenticated: true, user: req.user });
    } else {
        res.send({ isAuthenticated: false });
    }
});

authRouter.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.send("Logged out");
    });
});

authRouter.get("/google", passport.authenticate("google"));

authRouter.get(
    "/google/callback",
    passport.authenticate("google", {
        failureRedirect: BASE_CLIENT_URL + "/login",
    }),
    (req, res) => {
        res.redirect(BASE_CLIENT_URL + "/movies");
    }
);
