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
const connect_mongo_1 = __importDefault(require("connect-mongo"));
require("dotenv/config");
const users_1 = require("./routes/users");
const movies_1 = require("./routes/movies");
const messages_1 = require("./routes/messages");
const auth_1 = require("./routes/auth");
const http_1 = require("http");
const socket_1 = require("./socket");
require("./util/auth");
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
app.use((0, express_session_1.default)({
    secret: process.env.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production" ? true : false,
    },
    store: connect_mongo_1.default.create({ mongoUrl: process.env.DATABASE_URL }),
}));
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
app.get("/", (_, res) => {
    res.send("Hello World!");
});
app.use("/api/users", users_1.userRouter);
app.use("/api/movies", movies_1.movieRouter);
app.use("/api/messages", messages_1.messageRouter);
app.use("/auth", auth_1.authRouter);
app.post("/auth/login", passport_1.default.authenticate("local"), (req, res) => {
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
mongoose_1.default
    .connect(process.env.DATABASE_URL)
    .then((_) => {
    const httpServer = (0, http_1.createServer)(app);
    const io = socket_1.socket.init(httpServer);
    io.on("connection", (socket) => {
        socket.on("join-room", (room) => socket.join(room));
    });
    httpServer.listen(process.env.PORT || 3000);
})
    .catch((error) => console.log(error));
