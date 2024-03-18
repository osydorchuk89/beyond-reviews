import passport from "passport";
import bcrypt from "bcrypt";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import { User } from "../models/user";
import { BASE_URL } from "./urls";

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: BASE_URL + "auth/google/callback",
            scope: ["profile", "email"],
        },
        (accessToken, refreshToken, profile, cb) => {
            User.findOne({ email: profile._json.email })
                .then((user) => {
                    if (!user) {
                        const newUser = new User({
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
                    } else {
                        return cb(null, user);
                    }
                })
                .catch((error) => cb(error));
        }
    )
);

passport.use(
    new LocalStrategy(
        { usernameField: "email", passwordField: "password" },
        (email, password, cb) => {
            User.findOne({ email: email })
                .then(async (user) => {
                    if (!user) {
                        return cb(new Error());
                    }
                    const userPassword = user.password!;
                    const passwordCorrect = await bcrypt.compare(
                        password,
                        userPassword
                    );
                    if (!passwordCorrect) {
                        return cb(new Error());
                    }
                    return cb(null, user);
                })
                .catch((error) => cb(error));
        }
    )
);

passport.serializeUser((user: Express.User, cb) => {
    cb(null, user);
});

passport.deserializeUser((user: Express.User, cb) => {
    cb(null, user);
});
