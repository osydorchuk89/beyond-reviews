import express from "express";
import session from "express-session";
import passport from "passport";
import cors from "cors";
import bodyParser from "body-parser";

import { movieRouter } from "./routes/movies";
import { userRouter } from "./routes/users";
import { messageRouter } from "./routes/messages";
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
app.use("/api/messages", messageRouter);
app.use("/auth", authRouter);

app.get("/", (_, res) => {
    res.send("Hello World!!!");
});

app.listen(process.env.PORT || 3000);
