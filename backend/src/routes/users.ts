import bcrypt from "bcrypt";
import { Router } from "express";
import { User } from "../models/user";
import { UserSchema } from "../util/schemas";

export const userRouter = Router();

userRouter.get("/", (req, res) => {
    res.send(req.user);
});

userRouter.post("/", async (req, res) => {
    const validationResult = UserSchema.safeParse(req.body);
    if (!validationResult.success) {
        res.status(500).send({ message: "Validation failed" });
    } else {
        const validatedData = validationResult.data;
        const userExists = await User.findOne({ email: validatedData.email });
        if (userExists) {
            res.status(409).send({
                message: "User with this email already exists",
            });
        } else {
            const hashedPassword = await bcrypt.hash(
                validatedData.password,
                12
            );
            validatedData.password = hashedPassword;
            const user = new User(validatedData);
            // user.save()
            //     .then(() => res.status(200).send())
            //     .catch((error) => res.status(500).send({ message: error.message }));
            try {
                await user.save();
                res.status(200).send();
            } catch (error: any) {
                res.status(500).send({ message: error.message });
            }
        }
    }
});
