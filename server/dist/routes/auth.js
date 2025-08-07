"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const authController_1 = require("../controllers/authController");
const constants_1 = require("../config/constants");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.post("/login", passport_1.default.authenticate("local"), authController_1.login);
exports.authRouter.get("/status", authController_1.getAuthStatus);
exports.authRouter.get("/logout", authController_1.logout);
exports.authRouter.get("/google", passport_1.default.authenticate("google"));
exports.authRouter.get("/google/callback", passport_1.default.authenticate("google", {
    failureRedirect: constants_1.BASE_CLIENT_URL + "/login",
}), authController_1.googleCallback);
