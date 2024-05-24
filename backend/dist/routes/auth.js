"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.get("/", (req, res) => {
    const isAuthenticated = req.isAuthenticated();
    console.log(isAuthenticated);
    let authStatus;
    if (isAuthenticated) {
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
