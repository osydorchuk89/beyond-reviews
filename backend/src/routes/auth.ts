import { Router } from "express";

export const authRouter = Router();

authRouter.get("/", (req, res) => {
    const isAuthenticated = req.isAuthenticated();
    console.log(req.session);

    let authStatus;

    if (isAuthenticated) {
        authStatus = {
            isAuthenticated: true,
            userData: req.user,
        };
    } else {
        authStatus = {
            isAuthenticated: false,
            userData: null,
        };
    }

    res.send(authStatus);
});
