"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const user_1 = require("../models/user");
const urls_1 = require("./urls");
exports.default = passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: urls_1.BASE_URL + "auth/google/callback",
}, (accessToken, refreshToken, profile, cb) => {
    user_1.User.findOne({ email: profile._json.email })
        .then((user) => {
        if (!user) {
            const newUser = new user_1.User({
                email: profile._json.email,
                googleId: profile.id,
            });
            newUser
                .save()
                .then(() => cb(null, newUser))
                .catch((error) => console.log(error));
        }
        else {
            return cb(null, user);
        }
    })
        .catch((error) => cb(error));
}));
passport_1.default.serializeUser(function (user, cb) {
    cb(null, user);
});
passport_1.default.deserializeUser(function (user, cb) {
    cb(null, user);
});
