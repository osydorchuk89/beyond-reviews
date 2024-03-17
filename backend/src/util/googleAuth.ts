import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user";
import { BASE_URL } from "./urls";

export default passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            callbackURL: BASE_URL + "auth/google/callback",
        },
        (accessToken, refreshToken, profile, cb) => {
            User.findOne({ email: profile._json.email })
                .then((user) => {
                    if (!user) {
                        const newUser = new User({
                            email: profile._json.email,
                            googleId: profile.id,
                        });
                        newUser
                            .save()
                            .then(() => cb(null, newUser))
                            .catch((error) => console.log(error));
                    } else {
                        return cb(null, user);
                    }
                })
                .catch((error) => cb(error));
        }
    )
);

passport.serializeUser(function (user: Express.User, cb) {
    cb(null, user);
});

passport.deserializeUser(function (user: Express.User, cb) {
    cb(null, user);
});
