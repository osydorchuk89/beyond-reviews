"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.get("/", (req, res) => {
    // const isAuthenticated = req.isAuthenticated();
    let authStatus;
    console.log(req.session);
    if (req.session.passport?.user) {
        authStatus = {
            isAuthenticated: true,
            userData: req.user,
        };
    }
    else {
        authStatus = {
            isAuthenticated: false,
            userData: null,
        };
    }
    res.send(authStatus);
});
