import mongoose from "mongoose";
const { Schema } = mongoose;

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

export const User = mongoose.model<IUser>("User", userSchema);
