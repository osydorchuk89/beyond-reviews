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
    res.redirect(BASE_CLIENT_URL + "/movies");
};
