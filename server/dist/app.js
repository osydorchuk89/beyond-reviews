"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const passport_1 = __importDefault(require("passport"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
require("dotenv/config");
const movies_1 = require("./routes/movies");
const users_1 = require("./routes/users");
const messages_1 = require("./routes/messages");
const auth_1 = require("./routes/auth");
require("./config/passport");
const app = (0, express_1.default)();
const corsOptions = {
    origin: [
        "http://localhost:5173",
        "https://beyond-reviews-smoc.onrender.com",
    ],
    credentials: true,
    optionSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
app.set("trust proxy", 1);
app.use((0, express_session_1.default)({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production" ? true : false,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        httpOnly: true,
        maxAge: 1000 * 60 * 24,
    },
    store: connect_mongo_1.default.create({
        mongoUrl: process.env.DATABASE_URL,
        collectionName: "sessions",
    }),
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use("/api/movies", movies_1.moviesRouter);
app.use("/api/users", users_1.usersRouter);
app.use("/api/messages", messages_1.messagesRouter);
app.use("/auth", auth_1.authRouter);
app.get("/", (_, res) => {
    res.send("Hello World!!!");
});
app.listen(process.env.PORT || 8080);
