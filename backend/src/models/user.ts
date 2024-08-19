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
    receivedFriendRequests: Types.ObjectId[];
    sentFriendRequests: Types.ObjectId[];
    friends: Types.ObjectId[];
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
    receivedFriendRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
    sentFriendRequests: [{ type: Schema.Types.ObjectId, ref: "User" }],
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

export const User = model<IUser>("User", userSchema);
