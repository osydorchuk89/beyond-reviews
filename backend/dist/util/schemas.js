"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = void 0;
const zod_1 = require("zod");
exports.UserSchema = zod_1.z.object({
    firstName: zod_1.z
        .string()
        .trim()
        .min(1, { message: "This field is required" })
        .min(2, { message: "First name should have at least two characters" }),
    lastName: zod_1.z
        .string()
        .trim()
        .min(1, { message: "This field is required" })
        .min(2, { message: "Last name should have at least two characters" }),
    email: zod_1.z
        .string()
        .trim()
        .min(1, { message: "This field is required" })
        .email({ message: "Please enter a valid email" }),
    password: zod_1.z
        .string()
        .trim()
        .min(1, { message: "This field is required" })
        .min(8, { message: "Password should have at least eight characters" }),
});
