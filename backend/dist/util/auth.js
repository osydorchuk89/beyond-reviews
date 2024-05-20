"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const passport_local_1 = require("passport-local");
const user_1 = require("../models/user");
const urls_1 = require("./urls");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: urls_1.BASE_URL + "auth/google/callback",
    scope: ["profile", "email"],
}, (accessToken, refreshToken, profile, cb) => {
    user_1.User.findOne({ email: profile._json.email })
        .then((user) => {
        if (!user) {
            const newUser = new user_1.User({
                firstName: profile._json.given_name,
                lastName: profile._json.family_name,
                email: profile._json.email,
                googleId: profile.id,
            });
            newUser
                .save()
                .then(() => cb(null, newUser))
                .catch((error) => console.log(error));
            return cb(null, newUser);
        }
        else {
            return cb(null, user);
        }
    })
        .catch((error) => cb(error));
}));
passport_1.default.use(new passport_local_1.Strategy({ usernameField: "email", passwordField: "password" }, (email, password, cb) => {
    user_1.User.findOne({ email: email })
        .then(async (user) => {
        if (!user) {
            return cb(new Error());
        }
        const userPassword = user.password;
        const passwordCorrect = await bcrypt_1.default.compare(password, userPassword);
        if (!passwordCorrect) {
            return cb(new Error());
        }
        return cb(null, user);
    })
        .catch((error) => cb(error));
}));
passport_1.default.serializeUser((user, cb) => {
    cb(null, user);
});
passport_1.default.deserializeUser((user, cb) => {
    cb(null, user);
});
