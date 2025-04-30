import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";

import { PrismaClient } from "../../generated/prisma";

const BASE_URL =
    process.env.NODE_ENV === "production"
        ? "http://beyond-reviews.eu-central-1.elasticbeanstalk.com"
        : "http://localhost:3000";

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
                        user.password!
                    );
                    if (!isValid) {
                        return cb(null, false, { message: "Invalid password" });
                    }
                    return cb(null, user);
                } else {
                    // if a user was found but has no password, this user was registered wis google
                    return cb(null, user);
                }
            } catch (err) {
                return cb(err);
            }
        }
    )
);

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: BASE_URL + "/auth/google/callback",
            scope: ["profile", "email"],
        },
        async (accessToken, refreshToken, profile, cb) => {
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
        }
    )
);

// Serialize user into the session
passport.serializeUser((user: any, cb) => {
    cb(null, user.id);
});

// Deserialize user from the session
passport.deserializeUser(async (id: string, cb) => {
    try {
        const user = await prisma.user.findUnique({ where: { id } });
        cb(null, user);
    } catch (err) {
        cb(err);
    }
});
