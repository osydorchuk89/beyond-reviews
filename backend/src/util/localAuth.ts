import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { User } from "../models/user";

export default passport.use(
    new LocalStrategy(
        { usernameField: "email", passwordField: "password" },
        (email, password, done) => {
            User.findOne({ email: email })
                .then((user) => {
                    if (!user) {
                        const newUser = new User({
                            email,
                            password,
                        });
                        newUser
                            .save()
                            .then(() => done(null, newUser))
                            .catch((error) => console.log(error));
                    } else {
                        return done(null, user);
                    }
                })
                .catch((error) => done(error));
        }
    )
);
