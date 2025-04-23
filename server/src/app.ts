import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import bodyParser from "body-parser";

import { movieRouter } from "./routes/movies.ts";
import { userRouter } from "./routes/users.ts";
import "./config/passport";
import { authRouter } from "./routes/auth.ts";

const app = express();

const corsOptions = {
    origin: [
        "http://localhost:5173",
        "https://beyond-reviews-smoc.onrender.com",
    ],
    credentials: true,
    optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.set("trust proxy", 1);

app.use(
    session({
        secret: process.env.EXPRESS_SESSION_SECRET!,
        resave: false,
        saveUninitialized: false,
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/movies", movieRouter);
app.use("/api/users", userRouter);
app.use("/auth", authRouter);

app.get("/", (_, res) => {
    res.send("Hello World!!!");
});

app.listen(3000);
