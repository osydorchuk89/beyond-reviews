import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import "dotenv/config";
import { userRouter } from "./routes/users";
import { helloRouter } from "./routes/hello";
import { BASE_CLIENT_URL } from "./util/urls";

import passport from "./util/googleAuth";

const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
};

const app = express();

app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use(
    session({
        secret: process.env.EXPRESS_SESSION_SECRET!,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true },
    })
);

app.get("/", (_, res) => {
    res.send("Hello World!");
});

app.use("/api/users", userRouter);

app.use("/api/hello", helloRouter);

app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    (_, res) => {
        res.redirect(BASE_CLIENT_URL);
    }
);

mongoose
    .connect(process.env.DATABASE_URL!)
    .then((_) => {
        app.listen(3000);
    })
    .catch((error) => console.log(error));
