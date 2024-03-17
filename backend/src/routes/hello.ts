import { Router } from "express";

export const helloRouter = Router();

helloRouter.get("/", (req, res) => {
    res.send("Hello");
});
