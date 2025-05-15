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
    photo: z.any().superRefine((files, ctx) => {
        if (files.length > 0 && files[0]?.size > MAX_FILE_SIZE) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Photo size should not exceed 5MB",
            });
        }
        if (
            files.length > 0 &&
            !ACCEPTED_IMAGE_TYPES.includes(files[0]?.type)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Only jpg, jpeg, png, or webp formats are accepted",
            });
        }
    }),
});

export const LoginSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, { message: "Email is required" })
        .email({ message: "Please enter a valid email" }),
    password: z.string().trim().min(1, { message: "Password is required" }),
});

export const ReviewSchema = z.object({
    rating: z.coerce
        .number({
            invalid_type_error: "Please select rating",
        })
        .min(1)
        .max(10),
    text: z.string().optional(),
});
