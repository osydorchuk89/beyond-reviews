import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

import { PrismaClient } from "@prisma/client";

const BASE_URL =
    process.env.NODE_ENV === "production"
        ? "https://beyond-reviews-193634881435.europe-west1.run.app"
        : "http://localhost:8080";

const prisma = new PrismaClient();

passport.use(
    new LocalStrategy(
        { usernameField: "email", passwordField: "password" },
        async (email, password, cb) => {
            try {
                const user = await prisma.user.findUnique({ where: { email } });
                if (!user) {
                    return cb(null, false, { message: "User not found" });
                }

                if (user.password) {
                    const isValid = await bcrypt.compare(
                        password,
                        user.password,
                    );
                    if (!isValid) {
                        return cb(null, false, { message: "Invalid password" });
                    }
                    return cb(null, user);
                } else {
                    return cb(null, false, {
                        message: "Please use Google to sign in",
                    });
                }
            } catch (err) {
                return cb(err);
            }
        },
    ),
);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: BASE_URL + "/auth/google/callback",
            scope: ["profile", "email"],
        },
        async (_accessToken, _refreshToken, profile, cb) => {
            try {
                const user = await prisma.user.findUnique({
                    where: { email: profile._json.email! },
                });
                if (user) {
                    return cb(null, user);
                } else {
                    const newUser = await prisma.user.create({
                        data: {
                            id: new ObjectId().toHexString(),
                            firstName: profile._json.given_name!,
                            lastName: profile._json.family_name!,
                            email: profile._json.email!,
                            photo: profile.photos
                                ? profile.photos[0].value
                                : "https://beyond-reviews-os.s3.eu-central-1.amazonaws.com/user-icon.png",
                        },
                    });
                    return cb(null, newUser);
                }
            } catch (err) {
                return cb(err);
            }
        },
    ),
);

// Serialize user into the session
passport.serializeUser((user: any, cb) => {
    cb(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, cb) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return cb(null, false);
        }
        cb(null, user);
    } catch (err) {
        cb(err);
    }
});
