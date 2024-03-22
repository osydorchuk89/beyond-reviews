import axios from "axios";
import { BASE_API_URL } from "./urls";

// const genres = {
//     12: "Adventure",
//     14: "Fantasy",
//     16: "Animation",
//     18: "Drama",
//     27: "Horror",
//     28: "Action",
//     35: "Comedy",
//     36: "History",
//     37: "Western",
//     53: "Thriller",
//     80: "Crime",
//     99: "Documentary",
//     878: "Science Fiction",
//     9648: "Mystery",
//     10402: "Music",
//     10749: "Romance",
//     10751: "Family",
//     10752: "War",
//     10770: "TV Movie",
// };

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
                poster: `https://image.tmdb.org/t/p/w600_and_h900_bestv2/${movieData.poster_path}`,
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
