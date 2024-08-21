import { MovieAddInfo, MovieMainInfo } from "./MovieInfo";
import { MovieRatingForm } from "./MovieRatingForm";
import { MovieReviews } from "./MovieReviews";

export const MovieDetails = () => {
    return (
        <div className="flex flex-col mx-48">
            <div className="flex gap-10 py-10">
                <MovieMainInfo />
                <div className="flex flex-col w-2/3 text-lg mt-2">
                    <MovieAddInfo />
                    <MovieRatingForm />
                </div>
            </div>
            <MovieReviews />
        </div>
    );
};
