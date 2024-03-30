import axios from "axios";
import { store } from "../store";
import { createFileRoute } from "@tanstack/react-router";
import { BASE_API_URL } from "../lib/urls";
import { MovieMainInfo, MovieAddInfo } from "../components/MovieInfo";
import { MovieRatingForm } from "../components/MovieRatingForm";
import { getMovie } from "../lib/requests";

const MovieDetails = () => {
    return (
        <div className="flex gap-10 mx-48 p-10">
            <MovieMainInfo />
            <div className="flex flex-col w-2/3 text-lg mt-2">
                <MovieAddInfo />
                <MovieRatingForm />
            </div>
        </div>
    );
};

// const fetchMovie = async (movieId: string) => {
//     const userId = store.getState().auth.userData?._id;
//     try {
//         const response = await axios({
//             method: "get",
//             url: `${BASE_API_URL}movies/${movieId}`,
//         });
//         if (userId) {
//         }
//         return response.data;
//     } catch (error) {
//         console.log(error);
//     }
// };

export const Route = createFileRoute("/movies/$movieId")({
    component: MovieDetails,
    loader: ({ params }) => {
        return getMovie(params.movieId);
    },
});
