import bcrypt from "bcrypt";
import { Router } from "express";
import { User } from "../models/user";
import { UserSchema } from "../util/schemas";
import { fileUpload } from "../upload";
import { UserRating } from "../models/userRating";

export const userRouter = Router();

userRouter.get("/", async (req, res) => {
    const users = await User.find();
    res.send(users);
});

userRouter.get("/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
        const user = await User.findById(userId).populate("likes", [
            "title",
            "releaseYear",
            "poster",
        ]);
        res.send(user);
    } catch (error) {
        res.send(error);
    }
});

userRouter.get("/:userId/ratings", async (req, res) => {
    const { userId } = req.params;
    try {
        const userRatings = await UserRating.find({ userId }).populate(
            "movieId",
            ["title", "releaseYear", "poster"]
        );
        res.send(userRatings);
    } catch (error) {
        res.send(error);
    }
});

userRouter.post("/", fileUpload.single("photo"), async (req, res) => {
    const userData = req.body;
    if (req.file) {
        const userPhotoFile: { [key: string]: any } = req.file;
        userData.photo = userPhotoFile.location;
    } else {
        userData.photo =
            "https://beyond-reviews-os.s3.eu-central-1.amazonaws.com/user-icon.png";
    }
    const validationResult = UserSchema.safeParse(userData);
    if (!validationResult.success) {
        res.status(500).send({ message: "Validation failed" });
    } else {
        const validatedData = validationResult.data;
        const userExists = await User.findOne({
            email: validatedData.email,
        });
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
            try {
                await user.save();
                res.status(200).send();
            } catch (error: any) {
                res.status(500).send({ message: error.message });
            }
        }
    }
});
