import { z } from "zod";

const MAX_FILE_SIZE = 4500000;
const ACCEPTED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
];

export const UserSchema = z.object({
    firstName: z
        .string()
        .trim()
        .min(1, { message: "This field is required" })
        .min(2, { message: "First name should have at least two characters" }),
    lastName: z
        .string()
        .trim()
        .min(1, { message: "This field is required" })
        .min(2, { message: "Last name should have at least two characters" }),
    email: z
        .string()
        .trim()
        .min(1, { message: "This field is required" })
        .email({ message: "Please enter a valid email" }),
    password: z
        .string()
        .trim()
        .min(1, { message: "This field is required" })
        .min(8, { message: "Password should have at least eight characters" }),
    photo: z
        .any()
        .refine((files: File[]) => files.length > 0, "Please upload your photo")
        .refine(
            (files: File[]) => files[0]?.size <= MAX_FILE_SIZE,
            "Photo size should not exceed 5MB"
        )
        .refine(
            (files: File[]) => ACCEPTED_IMAGE_TYPES.includes(files[0]?.type),
            "Only jpg, jpeg, png, or webp formats are accepted"
        ),
});

export const LoginSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, { message: "This field is required" })
        .email({ message: "Please enter a valid email" }),
    password: z.string().trim().min(1, { message: "This field is required" }),
});

export const UserRatingSchema = z.object({
    movieRating: z.coerce
        .number({
            invalid_type_error: "Please select rating",
        })
        .min(1)
        .max(10),
    movieReview: z.string().optional(),
});
