import { Router } from "express";

export const authRouter = Router();

authRouter.get("/", (req, res) => {
    // const isAuthenticated = req.isAuthenticated();
    let authStatus;
    console.log(req.session);

    if (req.session.passport && req.session.passport.user) {
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
