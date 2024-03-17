"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const user_1 = require("../models/user");
exports.default = passport_1.default.use(new passport_local_1.Strategy({ usernameField: "email", passwordField: "password" }, (email, password, done) => {
    user_1.User.findOne({ email: email })
        .then((user) => {
        if (!user) {
            const newUser = new user_1.User({
                email,
                password,
            });
            newUser
                .save()
                .then(() => done(null, newUser))
                .catch((error) => console.log(error));
        }
        else {
            return done(null, user);
        }
    })
        .catch((error) => done(error));
}));
