import bcrypt from "bcrypt";
import { Router } from "express";
import { PrismaClient } from "../../generated/prisma";
import { fileUpload } from "../lib/upload";
import { UserSchema } from "../lib/schemas";

export const userRouter = Router();
const prisma = new PrismaClient();

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
        const userExists = await prisma.user.findUnique({
            where: {
                email: validatedData.email,
            },
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
            // const user = new User(validatedData);
            try {
                await prisma.user.create({ data: validatedData });
                res.status(200).send();
            } catch (error: any) {
                res.status(500).send({ message: error.message });
            }
        }
    }
});
