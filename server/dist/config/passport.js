"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const bcrypt_1 = __importDefault(require("bcrypt"));
const mongodb_1 = require("mongodb");
const prisma_1 = require("../../generated/prisma");
const BASE_URL = process.env.NODE_ENV === "production"
    ? "https://beyond-reviews.onrender.com"
    : "http://localhost:3000";
const prisma = new prisma_1.PrismaClient();
passport_1.default.use(new passport_local_1.Strategy({ usernameField: "email", passwordField: "password" }, async (email, password, cb) => {
    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return cb(null, false, { message: "User not found" });
        }
        if (user.password) {
            const isValid = await bcrypt_1.default.compare(password, user.password);
            if (!isValid) {
                return cb(null, false, { message: "Invalid password" });
            }
            return cb(null, user);
        }
        else {
            // if a user was found but has no password, this user was registered wis google
            return cb(null, user);
        }
    }
    catch (err) {
        return cb(err);
    }
}));
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: BASE_URL + "/auth/google/callback",
    scope: ["profile", "email"],
}, async (accessToken, refreshToken, profile, cb) => {
    try {
        const user = await prisma.user.findUnique({
            where: { email: profile._json.email },
        });
        if (user) {
            return cb(null, user);
        }
        else {
            const newUser = await prisma.user.create({
                data: {
                    id: new mongodb_1.ObjectId().toHexString(),
                    firstName: profile._json.given_name,
                    lastName: profile._json.family_name,
                    email: profile._json.email,
                    photo: profile.photos
                        ? profile.photos[0].value
                        : "https://beyond-reviews-os.s3.eu-central-1.amazonaws.com/user-icon.png",
                },
            });
            return cb(null, newUser);
        }
    }
    catch (err) {
        return cb(err);
    }
}));
// Serialize user into the session
passport_1.default.serializeUser((user, cb) => {
    cb(null, user.id);
});
// Deserialize user from the session
passport_1.default.deserializeUser(async (id, cb) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        cb(null, user);
    }
    catch (err) {
        cb(err);
    }
});
