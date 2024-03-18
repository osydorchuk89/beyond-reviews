"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const passport_local_1 = require("passport-local");
const user_1 = require("../models/user");
passport_1.default.use(new passport_local_1.Strategy({ usernameField: "email", passwordField: "password" }, (email, password, done) => {
    user_1.User.findOne({ email: email })
        .then(async (user) => {
        if (!user) {
            return done(null, false, {
                message: "Incorrect username or password.",
            });
        }
        else {
            const userPassword = user.password;
            const passwordCorrect = await bcrypt_1.default.compare(password, userPassword);
            if (!passwordCorrect) {
                done(null, false, {
                    message: "Incorrect username or password.",
                });
                return done(null, user);
            }
        }
    })
        .catch((error) => done(error));
}));
passport_1.default.serializeUser(function (user, cb) {
    cb(null, user);
});
passport_1.default.deserializeUser(function (user, cb) {
    cb(null, user);
});
