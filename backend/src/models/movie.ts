import mongoose from "mongoose";
const { Schema } = mongoose;

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
    poster: String,
});

export const Movie = mongoose.model<IMovie>("Movie", movieSchema);
