import axios from "axios";
import { BASE_API_URL } from "./urls";

const BASE_URL = "https://api.themoviedb.org/3/movie/";

export const fetchMovies = async (page: Number) => {
    const options = {
        method: "get",
        headers: {
            accept: "application/json",
            Authorization:
                "Bearer " + import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN,
        },
    };
    try {
        const response = await axios({
            ...options,
            url: BASE_URL + `popular?page=${page}`,
        });
        const moviesData = [];
        for (const movie of response.data.results) {
            const movieResponse = await axios({
                ...options,
                url: BASE_URL + movie.id,
            });
            const movieCastResponse = await axios({
                ...options,
                url: BASE_URL + movie.id + "/credits",
            });
            const movieData = movieResponse.data;
            const movieCrewData = movieCastResponse.data.crew;
            const movieDirector = movieCrewData.find(
                (item: any) => item.job === ("Director" || "Co-Director")
            ).name;
            const movieGenres = movieData.genres.map(
                (item: { id: number; name: string }) => item.name
            );
            moviesData.push({
                title: movieData.title,
                releaseYear: +movieData.release_date.slice(0, 4),
                director: movieDirector,
                overview: movieData.overview,
                language: movieData.original_language,
                genres: movieGenres,
                runtime: movieData.runtime,
                avgVote: movieData.vote_average,
                numVotes: movieData.vote_count,
                ratings: [],
                poster: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movieData.poster_path}`,
            });
            console.log("done");
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

export const fetchMovieGenres = async () => {
    const options = {
        method: "get",
        url: "https://api.themoviedb.org/3/genre/movie/list",
        headers: {
            accept: "application/json",
            Authorization:
                "Bearer " + import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN,
        },
    };
    try {
        const response = await axios(options);
        const genresArray = response.data.genres;
        const genres: any = {};
        for (const genre of genresArray) {
            genres[genre.id] = genre.name;
        }
        return genres;
    } catch (error) {
        console.log(error);
    }
};
