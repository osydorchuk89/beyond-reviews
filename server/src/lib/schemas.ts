import { z } from "zod";

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
    photo: z.string(),
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

export type User = z.infer<typeof UserSchema>;
