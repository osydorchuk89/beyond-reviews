import mongoose from "mongoose";
const { Schema } = mongoose;

export interface IMovie {
    title: string;
    releaseYear: number;
    overview: string;
    language: string;
    avgVote: number;
    numVotes: number;
    poster: string;
}

const movieSchema = new Schema<IMovie>({
    title: String,
    releaseYear: Number,
    overview: String,
    language: String,
    avgVote: Number,
    numVotes: Number,
    poster: String,
});

export const Movie = mongoose.model<IMovie>("Movie", movieSchema);
