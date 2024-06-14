import { Schema, Types, model } from "mongoose";

export interface IUser {
    firstName: string;
    lastName: string;
    email: string;
    photo: string;
    password?: string;
    googleId?: string;
    ratings?: Types.ObjectId[];
    watchList: Types.ObjectId[];
}

const userSchema = new Schema<IUser>({
    firstName: String,
    lastName: String,
    email: { type: String, required: true, unique: true },
    photo: String,
    password: String,
    googleId: String,
    ratings: [{ type: Schema.Types.ObjectId, ref: "UserRating" }],
    watchList: [{ type: Schema.Types.ObjectId, ref: "Movie" }],
});

export const User = model<IUser>("User", userSchema);
