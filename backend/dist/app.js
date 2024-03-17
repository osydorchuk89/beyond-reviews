"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
const express_session_1 = __importDefault(require("express-session"));
require("dotenv/config");
const users_1 = require("./routes/users");
const hello_1 = require("./routes/hello");
const urls_1 = require("./util/urls");
const googleAuth_1 = __importDefault(require("./util/googleAuth"));
const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true, //access-control-allow-credentials:true
    optionSuccessStatus: 200,
};
const app = (0, express_1.default)();
app.use((0, cors_1.default)(corsOptions));
app.use(body_parser_1.default.urlencoded({ extended: false }));
app.use(body_parser_1.default.json());
app.use((0, express_session_1.default)({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true },
}));
app.get("/", (_, res) => {
    res.send("Hello World!");
});
app.use("/api/users", users_1.userRouter);
app.use("/api/hello", hello_1.helloRouter);
app.get("/auth/google", googleAuth_1.default.authenticate("google", { scope: ["profile", "email"] }));
app.get("/auth/google/callback", googleAuth_1.default.authenticate("google", { failureRedirect: "/login" }), (_, res) => {
    res.redirect(urls_1.BASE_CLIENT_URL);
});
mongoose_1.default
    .connect(process.env.DATABASE_URL)
    .then((_) => {
    app.listen(3000);
})
    .catch((error) => console.log(error));
