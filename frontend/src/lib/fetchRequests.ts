import axios from "axios";
import { BASE_API_URL } from "./urls";

export const fetchMovies = async (page: Number) => {
    const options = {
        method: "get",
        url: `https://api.themoviedb.org/3/movie/popular?page=${page}`,
        headers: {
            accept: "application/json",
            Authorization:
                "Bearer " + import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN,
        },
    };
    try {
        const response = await axios(options);
        const moviesData = [];
        for (const movie of response.data.results) {
            moviesData.push({
                title: movie.title,
                releaseYear: +movie.release_date.slice(0, 4),
                overview: movie.overview,
                language: movie.original_language,
                avgVote: movie.vote_average,
                numVotes: movie.vote_count,
                poster: movie.poster_path,
            });
        }
        try {
            await axios({
                method: "post",
                url: BASE_API_URL + "movies",
                data: moviesData,
            });
        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
};
