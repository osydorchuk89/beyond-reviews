import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import bodyParser from "body-parser";
import MongoStore from "connect-mongo";
import dotenv from "dotenv";

import { moviesRouter } from "./routes/movies";
import { usersRouter } from "./routes/users";
import { messagesRouter } from "./routes/messages";
import { authRouter } from "./routes/auth";
import "./config/passport";

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

dotenv.config();
const sessionSecret = process.env.EXPRESS_SESSION_SECRET;

if (!sessionSecret) {
    throw new Error("EXPRESS_SESSION_SECRET environment variable is not set");
}

app.use(
    session({
        secret: sessionSecret,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production" ? true : false,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            httpOnly: true,
            maxAge: 1000 * 60 * 24,
        },
        store: MongoStore.create({
            mongoUrl: process.env.DATABASE_URL,
            collectionName: "sessions",
        }),
    }),
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/api/movies", moviesRouter);
app.use("/api/users", usersRouter);
app.use("/api/messages", messagesRouter);
app.use("/auth", authRouter);

app.get("/", (_req, res) => {
    res.send("Hello World!!!");
});

app.listen(process.env.PORT || 8080);
