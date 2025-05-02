"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const BASE_CLIENT_URL = process.env.NODE_ENV === "production"
    ? "https://beyond-reviews-smoc.onrender.com"
    : "http://localhost:5173";
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/login", passport_1.default.authenticate("local"), (req, res) => {
    res.send(req.user);
});
exports.authRouter.get("/status", (req, res) => {
    if (req.isAuthenticated()) {
        res.send({ isAuthenticated: true, user: req.user });
    }
    else {
        res.send({ isAuthenticated: false });
    }
});
exports.authRouter.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.send("Logged out");
    });
});
exports.authRouter.get("/google", passport_1.default.authenticate("google"));
exports.authRouter.get("/google/callback", passport_1.default.authenticate("google", {
    failureRedirect: BASE_CLIENT_URL + "/login",
}), (req, res) => {
    res.redirect(BASE_CLIENT_URL + "/movies");
});
