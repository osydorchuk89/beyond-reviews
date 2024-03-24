import { Schema, model, Types } from "mongoose";

export interface IMovie {
    title: string;
    releaseYear: number;
    director: string;
    overview: string;
    language: string;
    genres: string[];
    runtime: number;
    avgVote: number;
    numVotes: number;
    ratings: Types.ObjectId[];
    poster: string;
}

const movieSchema = new Schema<IMovie>({
    title: String,
    releaseYear: Number,
    director: String,
    overview: String,
    language: String,
    genres: [String],
    runtime: Number,
    avgVote: Number,
    numVotes: Number,
    ratings: [{ type: Schema.Types.ObjectId, ref: "UserRating" }],
    poster: String,
});

export const Movie = model<IMovie>("Movie", movieSchema);
