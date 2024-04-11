import { Schema, Types, model } from "mongoose";

export interface IUserRating {
    userId: Types.ObjectId;
    movieId: Types.ObjectId;
    movieRating: number;
    movieReview?: string;
    date: Date;
}

const userRatingSchema = new Schema<IUserRating>({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    movieId: { type: Schema.Types.ObjectId, ref: "Movie" },
    movieRating: Number,
    movieReview: String,
    date: Date,
});

export const UserRating = model<IUserRating>("UserRating", userRatingSchema);
