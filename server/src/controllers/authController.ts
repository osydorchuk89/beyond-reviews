import type { Request, Response } from "express";
import { auth, AUTH_BASE_URL } from "../config/auth.js";
import { BASE_CLIENT_URL } from "../config/constants.js";
import { callAuth, forwardCookies, readAuthResponse, safeReturnPath, toAppUser } from "../lib/auth-http.js";

export const login = async (req: Request, res: Response) => {
    const response = await callAuth(auth, AUTH_BASE_URL, req, "/sign-in/email", {
        email: req.body.email, password: req.body.password,
    });
    forwardCookies(response, res);
    const data = await readAuthResponse(response);
    if (!response.ok) { res.status(response.status).send(data); return; }
    res.send(toAppUser(data.user));
};

export const getAuthStatus = (req: Request, res: Response) => {
    res.send(req.user ? { isAuthenticated: true, user: req.user } : { isAuthenticated: false });
};

export const logout = async (req: Request, res: Response) => {
    const response = await callAuth(auth, AUTH_BASE_URL, req, "/sign-out", {});
    forwardCookies(response, res);
    if (!response.ok) { res.status(response.status).send(await response.json()); return; }
    res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.send("Logged out");
};

export const googleLogin = async (req: Request, res: Response) => {
    const from = safeReturnPath(req.query.from ?? "/");
    const response = await callAuth(auth, AUTH_BASE_URL, req, "/sign-in/social", {
        provider: "google", callbackURL: BASE_CLIENT_URL + from,
        errorCallbackURL: BASE_CLIENT_URL + "/login",
    });
    forwardCookies(response, res);
    const data = await readAuthResponse(response);
    if (!response.ok || !data.url) { res.redirect(BASE_CLIENT_URL + "/login"); return; }
    res.redirect(data.url);
};
