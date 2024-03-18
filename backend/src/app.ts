import express, { RequestHandler } from "express";
import mongoose from "mongoose";
import passport from "passport";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import "dotenv/config";
import { userRouter } from "./routes/users";
import { helloRouter } from "./routes/hello";
import { BASE_CLIENT_URL } from "./util/urls";
require("./util/auth");

const isLoggedIn: RequestHandler = (req, res, next) => {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.send("Unathorized");
    }
};

const app = express();

const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true,
    optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use(
    session({
        secret: process.env.EXPRESS_SESSION_SECRET!,
        resave: false,
        saveUninitialized: true,
        // cookie: { secure: true },
    })
);
// app.use(passport.authenticate("session"));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (_, res) => {
    res.send("Hello World!");
});

app.use("/api/users", userRouter);

app.use("/api/hello", helloRouter);

app.post("/auth/login", passport.authenticate("local"), (req, res) => {
    res.send("success");
});

app.get("/auth/google", passport.authenticate("google"));

app.get(
    "/auth/google/callback",
    passport.authenticate("google"),
    (req, res) => {
        res.redirect(BASE_CLIENT_URL);
    }
);

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
    });
    res.send("Logged out");
});

app.get("/protected", isLoggedIn, (req, res) => {
    res.send(req.user);
});

mongoose
    .connect(process.env.DATABASE_URL!)
    .then((_) => {
        app.listen(3000);
    })
    .catch((error) => console.log(error));
