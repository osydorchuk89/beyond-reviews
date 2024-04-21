import { Schema, Types, model } from "mongoose";

export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
    googleId?: string;
    ratings?: Types.ObjectId[];
    likes?: Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    password: String,
    googleId: String,
    ratings: [{ type: Schema.Types.ObjectId, ref: "UserRating" }],
    likes: [{ type: Schema.Types.ObjectId, ref: "Movie" }],
});

export const User = model<IUser>("User", userSchema);
