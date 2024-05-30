"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRatingSchema = exports.UserSchema = void 0;
const zod_1 = require("zod");
const MAX_FILE_SIZE = 4500000;
const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];
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
    photo: zod_1.z.string(),
});
exports.UserRatingSchema = zod_1.z.object({
    movieRating: zod_1.z.coerce
        .number({
        invalid_type_error: "Please select rating",
    })
        .min(1)
        .max(10),
    movieReview: zod_1.z.string().optional(),
});
