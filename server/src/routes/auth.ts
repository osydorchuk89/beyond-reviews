import { Router } from "express";
import {
    getAuthStatus,
    googleLogin,
    login,
    logout,
} from "../controllers/authController.js";

export const authRouter = Router();
authRouter.post("/login", login);
authRouter.get("/status", getAuthStatus);
authRouter.post("/logout", logout);
authRouter.get("/google", googleLogin);
