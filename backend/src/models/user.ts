import { Schema, model } from "mongoose";

export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    googleId?: string;
}

const userSchema = new Schema<IUser>({
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    password: String,
    googleId: String,
});

export const User = model<IUser>("User", userSchema);
