"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const express_1 = require("express");
const user_1 = require("../models/user");
const schemas_1 = require("../util/schemas");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.get("/", (req, res) => {
    if (req.user) {
        res.send(req.user);
    }
    else {
        res.send("no user");
    }
});
exports.userRouter.post("/", async (req, res) => {
    const validationResult = schemas_1.UserSchema.safeParse(req.body);
    if (!validationResult.success) {
        res.status(500).send({ message: "Validation failed" });
    }
    else {
        const validatedData = validationResult.data;
        const userExists = await user_1.User.findOne({ email: validatedData.email });
        if (userExists) {
            res.status(409).send({
                message: "User with this email already exists",
            });
        }
        else {
            const hashedPassword = await bcrypt_1.default.hash(validatedData.password, 12);
            validatedData.password = hashedPassword;
            const user = new user_1.User(validatedData);
            // user.save()
            //     .then(() => res.status(200).send())
            //     .catch((error) => res.status(500).send({ message: error.message }));
            try {
                await user.save();
                res.status(200).send();
            }
            catch (error) {
                res.status(500).send({ message: error.message });
            }
        }
    }
});
