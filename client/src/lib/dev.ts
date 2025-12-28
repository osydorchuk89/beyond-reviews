import axios from "axios";
import { faker } from "@faker-js/faker";

import axiosInstance, { BASE_URL } from "./axiosInstance";

const BASE_TMDB_URL = "https://api.themoviedb.org/3/movie/";

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
            url: BASE_TMDB_URL + `popular?page=${page}`,
        });
        const moviesData = [];
        for (const movie of response.data.results) {
            const movieResponse = await axios({
                ...options,
                url: BASE_TMDB_URL + movie.id,
            });
            const movieCastResponse = await axios({
                ...options,
                url: BASE_TMDB_URL + movie.id + "/credits",
            });
            const movieData = movieResponse.data;
            const movieCrewData = movieCastResponse.data.crew;
            const movieDirector =
                movieCrewData?.find(
                    (item: any) =>
                        item.job === "Director" || item.job === "Co-Director"
                )?.name ?? "Unknown Director";
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
                avgRating: 0,
                numRatings: 0,
                poster: `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movieData.poster_path}`,
            });
        }
        try {
            const response = await axiosInstance.post(
                `${BASE_URL}/api/movies`,
                moviesData
            );
            console.log(response);
        } catch (error) {
            console.log(error);
        }
    } catch (error) {
        console.log(error);
    }
};

export const createUsers = async () => {
    const NUM_USERS = 100;

    const users = Array.from({ length: NUM_USERS }, (_, i) => ({
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `user${i + 1}@example.com`,
        password: faker.internet.password(),
        photo: faker.image.avatar(),
    }));

    await axiosInstance.post(`${BASE_URL}/api/users/seed`, users);
};
