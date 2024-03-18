"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const passport_1 = __importDefault(require("passport"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_session_1 = __importDefault(require("express-session"));
require("dotenv/config");
const users_1 = require("./routes/users");
const hello_1 = require("./routes/hello");
const urls_1 = require("./util/urls");
require("./util/auth");
const isLoggedIn = (req, res, next) => {
    req.isAuthenticated() ? next() : res.send("Unathorized");
};
const app = (0, express_1.default)();
const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true,
    optionSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
app.use((0, express_session_1.default)({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    // cookie: { secure: true },
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.use(passport_1.default.authenticate("session"));
app.get("/", (_, res) => {
    res.send("Hello World!");
});
app.use("/api/users", users_1.userRouter);
app.use("/api/hello", hello_1.helloRouter);
app.post("/auth/login", passport_1.default.authenticate("local", {
    // successRedirect: BASE_CLIENT_URL,
    failureRedirect: urls_1.BASE_CLIENT_URL + "/login",
}), (req, res) => {
    console.log(req.user);
    res.send(req.user);
});
app.get("/auth/google", passport_1.default.authenticate("google"));
app.get("/auth/google/callback", passport_1.default.authenticate("google", {
    // successRedirect: BASE_CLIENT_URL,
    failureRedirect: urls_1.BASE_CLIENT_URL + "/login",
}), (req, res) => {
    res.redirect(urls_1.BASE_CLIENT_URL);
    // res.send(req.user);
});
app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
    });
    res.send("Logged out");
});
mongoose_1.default
    .connect(process.env.DATABASE_URL)
    .then((_) => {
    app.listen(3000);
})
    .catch((error) => console.log(error));
