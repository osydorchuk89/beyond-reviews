import express from "express";
import mongoose from "mongoose";
import passport from "passport";
import cors from "cors";
import bodyParser from "body-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import "dotenv/config";
import { userRouter } from "./routes/users";
import { movieRouter } from "./routes/movies";
import { messageRouter } from "./routes/messages";
import { authRouter } from "./routes/auth";
import { createServer } from "http";
import { socket } from "./socket";
require("./util/auth");

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
        saveUninitialized: true,
        cookie: {
            secure: process.env.NODE_ENV === "production" ? true : false,
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            httpOnly: true,
            maxAge: 1000 * 60 * 24,
        },
        store: MongoStore.create({ mongoUrl: process.env.DATABASE_URL! }),
    })
);
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (_, res) => {
    res.send("Hello World!");
});

app.use("/api/users", userRouter);
app.use("/api/movies", movieRouter);
app.use("/api/messages", messageRouter);
app.use("/auth", authRouter);

app.post("/auth/login", passport.authenticate("local"), (req, res) => {
    res.send(req.user);
});

// app.get("/auth/google", passport.authenticate("google"));

// app.get(
//     "/auth/google/callback",
//     passport.authenticate("google", {
//         successRedirect: BASE_CLIENT_URL + "/login/success",
//     }),
//     (req, res) => {
//         res.send(req.user);
//     }
// );

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
    });
    res.send("Logged out");
});

mongoose
    .connect(process.env.DATABASE_URL!)
    .then((_) => {
        const httpServer = createServer(app);
        const io = socket.init(httpServer);
        io.on("connection", (socket) => {
            socket.on("join-room", (room) => socket.join(room));
        });
        httpServer.listen(process.env.PORT || 3000);
    })
    .catch((error) => console.log(error));
