import axios from "axios";
import { faker } from "@faker-js/faker";

import axiosInstance, { BASE_URL } from "./axiosInstance";

const BASE_TMDB_URL = "https://api.themoviedb.org/3/movie/";
const BASE_TMDB_DISCOVER_URL = "https://api.themoviedb.org/3/discover/movie";

// Helper function to get existing movies from the database in batches
const getExistingMovies = async (): Promise<Set<string>> => {
    try {
        const existingMovies = new Set<string>();
        let page = 1;
        let hasMore = true;
        const limit = 100; // Fetch 100 movies per page to avoid overwhelming the server

        console.log("📚 Fetching existing movies from database...");

        while (hasMore) {
            try {
                const response = await axiosInstance.get(
                    `${BASE_URL}/api/movies`,
                    {
                        params: {
                            page,
                            limit,
                        },
                    },
                );

                const movies = response.data.movies || [];

                // Add movies to the set
                movies.forEach((movie: any) => {
                    const identifier = `${movie.title}|${movie.releaseYear}`;
                    existingMovies.add(identifier);
                });

                // Check if there are more pages
                hasMore = response.data.hasMore || false;
                page++;

                // Optional: Log progress for large databases
                if (
                    existingMovies.size > 0 &&
                    existingMovies.size % 500 === 0
                ) {
                    console.log(
                        `   Loaded ${existingMovies.size} movies so far...`,
                    );
                }
            } catch (pageError) {
                console.error(`Failed to fetch page ${page}:`, pageError);
                hasMore = false; // Stop trying if a page fails
            }
        }

        console.log(
            `📚 Found ${existingMovies.size} existing movies in database`,
        );
        return existingMovies;
    } catch (error) {
        console.error("Failed to fetch existing movies:", error);
        return new Set(); // Return empty set on error, will add all movies
    }
};

export const fetchMovies = async (page: number) => {
    const options = {
        method: "get",
        headers: {
            accept: "application/json",
            Authorization:
                "Bearer " + import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN,
        },
    };

    try {
        // Fetch popular movies list
        const response = await axios({
            ...options,
            url: BASE_TMDB_URL + `popular?page=${page}`,
        });

        const movies = response.data.results;

        // Helper function to add delay between requests
        const delay = (ms: number) =>
            new Promise((resolve) => setTimeout(resolve, ms));

        // Fetch movie details with credits in parallel using append_to_response
        const moviePromises = movies.map(async (movie: any, index: number) => {
            // Add small staggered delay to respect rate limits
            await delay(index * 50); // 50ms between each request

            try {
                // Use append_to_response to get details + credits in ONE call
                const movieResponse = await axios({
                    ...options,
                    url:
                        BASE_TMDB_URL +
                        `${movie.id}?append_to_response=credits`,
                });

                const movieData = movieResponse.data;
                const movieCrewData = movieData.credits?.crew || [];

                const movieDirector =
                    movieCrewData.find(
                        (item: any) =>
                            item.job === "Director" ||
                            item.job === "Co-Director",
                    )?.name ?? "Unknown Director";

                const movieGenres =
                    movieData.genres?.map(
                        (item: { id: number; name: string }) => item.name,
                    ) || [];

                return {
                    title: movieData.title,
                    releaseYear: movieData.release_date
                        ? +movieData.release_date.slice(0, 4)
                        : new Date().getFullYear(),
                    director: movieDirector,
                    overview: movieData.overview || "",
                    language: movieData.original_language,
                    genres: movieGenres,
                    runtime: movieData.runtime || 0,
                    avgRating: 0,
                    numRatings: 0,
                    poster: movieData.poster_path
                        ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movieData.poster_path}`
                        : "",
                };
            } catch (error) {
                console.error(`Failed to fetch movie ${movie.id}:`, error);
                return null; // Return null for failed movies
            }
        });

        // Wait for all movie requests to complete
        const movieResults = await Promise.allSettled(moviePromises);

        // Filter out failed requests and null values
        const moviesData = movieResults
            .filter(
                (result) =>
                    result.status === "fulfilled" && result.value !== null,
            )
            .map((result: any) => result.value);

        console.log(
            `Successfully fetched ${moviesData.length} out of ${movies.length} movies from page ${page}`,
        );

        // Save to database
        if (moviesData.length > 0) {
            try {
                const saveResponse = await axiosInstance.post(
                    `${BASE_URL}/api/movies`,
                    moviesData,
                );
                console.log(`✓ Saved ${moviesData.length} movies to database`);
                return saveResponse.data;
            } catch (error) {
                console.error("Failed to save movies to database:", error);
                throw error;
            }
        } else {
            console.warn("No movies to save");
        }
    } catch (error) {
        console.error("Failed to fetch popular movies list:", error);
        throw error;
    }
};

export const fetchTop100MoviesPerYearLast100Years = async () => {
    const options = {
        method: "get",
        headers: {
            accept: "application/json",
            Authorization:
                "Bearer " + import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN,
        },
    };

    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 99; // Last 100 years including current
    const totalYears = 100;

    console.log(
        `🎬 Fetching top 100 movies PER YEAR from ${startYear} to ${currentYear}...`,
    );
    console.log(`📊 Target: Up to ${totalYears * 100} movies total\n`);

    try {
        // First, get existing movies from database
        const existingMovies = await getExistingMovies();

        const allMovies: any[] = [];
        let totalNewMovies = 0;
        let totalSkipped = 0;
        let yearsProcessed = 0;

        // Helper function to add delay between requests
        const delay = (ms: number) =>
            new Promise((resolve) => setTimeout(resolve, ms));

        // Process each year
        for (let year = startYear; year <= currentYear; year++) {
            yearsProcessed++;
            console.log(
                `\n📅 Year ${year} (${yearsProcessed}/${totalYears})...`,
            );

            const yearMovies: any[] = [];
            const moviesPerPage = 20;
            const maxMoviesPerYear = 100;
            const pagesToFetch = Math.ceil(maxMoviesPerYear / moviesPerPage); // 5 pages

            // Fetch multiple pages for this year
            for (let page = 1; page <= pagesToFetch; page++) {
                try {
                    const response = await axios({
                        ...options,
                        url: `${BASE_TMDB_DISCOVER_URL}?primary_release_year=${year}&sort_by=popularity.desc&page=${page}`,
                    });

                    const movies = response.data.results;

                    if (movies.length === 0) {
                        console.log(`   ⚠️  No more movies found for ${year}`);
                        break;
                    }

                    // Fetch movie details with credits in parallel
                    const moviePromises = movies.map(
                        async (movie: any, index: number) => {
                            await delay(index * 50);

                            try {
                                const movieResponse = await axios({
                                    ...options,
                                    url:
                                        BASE_TMDB_URL +
                                        `${movie.id}?append_to_response=credits`,
                                });

                                const movieData = movieResponse.data;
                                const movieCrewData =
                                    movieData.credits?.crew || [];

                                const movieDirector =
                                    movieCrewData.find(
                                        (item: any) =>
                                            item.job === "Director" ||
                                            item.job === "Co-Director",
                                    )?.name ?? "Unknown Director";

                                const movieGenres =
                                    movieData.genres?.map(
                                        (item: { id: number; name: string }) =>
                                            item.name,
                                    ) || [];

                                return {
                                    title: movieData.title,
                                    releaseYear: movieData.release_date
                                        ? +movieData.release_date.slice(0, 4)
                                        : year,
                                    director: movieDirector,
                                    overview: movieData.overview || "",
                                    language: movieData.original_language,
                                    genres: movieGenres,
                                    runtime: movieData.runtime || 0,
                                    avgRating: 0,
                                    numRatings: 0,
                                    poster: movieData.poster_path
                                        ? `https://image.tmdb.org/t/p/w600_and_h900_bestv2${movieData.poster_path}`
                                        : "",
                                };
                            } catch (error) {
                                console.error(
                                    `Failed to fetch movie ${movie.id}:`,
                                    error,
                                );
                                return null;
                            }
                        },
                    );

                    const movieResults =
                        await Promise.allSettled(moviePromises);
                    const moviesData = movieResults
                        .filter(
                            (result) =>
                                result.status === "fulfilled" &&
                                result.value !== null,
                        )
                        .map((result: any) => result.value);

                    yearMovies.push(...moviesData);

                    // Stop if we have enough movies for this year
                    if (yearMovies.length >= maxMoviesPerYear) {
                        break;
                    }

                    // Add delay between pages
                    if (page < pagesToFetch) {
                        await delay(300);
                    }
                } catch (error) {
                    console.error(
                        `Failed to fetch page ${page} for year ${year}:`,
                        error,
                    );
                }
            }

            // Limit to 100 movies per year
            const top100ForYear = yearMovies.slice(0, maxMoviesPerYear);

            // Filter out duplicates
            const newMoviesForYear = top100ForYear.filter((movie) => {
                const identifier = `${movie.title}|${movie.releaseYear}`;
                return !existingMovies.has(identifier);
            });

            // Add to existing movies set to prevent duplicates in subsequent years
            newMoviesForYear.forEach((movie) => {
                const identifier = `${movie.title}|${movie.releaseYear}`;
                existingMovies.add(identifier);
            });

            totalNewMovies += newMoviesForYear.length;
            totalSkipped += top100ForYear.length - newMoviesForYear.length;
            allMovies.push(...newMoviesForYear);

            console.log(
                `   ✓ ${year}: ${top100ForYear.length} fetched, ${newMoviesForYear.length} new, ${top100ForYear.length - newMoviesForYear.length} duplicates`,
            );
            console.log(
                `   📈 Progress: ${totalNewMovies} total new movies so far`,
            );

            // Save in smaller batches (every 500 movies) to avoid payload too large error
            if (allMovies.length >= 500) {
                console.log(
                    `\n💾 Saving batch of ${allMovies.length} movies to database...`,
                );
                try {
                    await axiosInstance.post(
                        `${BASE_URL}/api/movies`,
                        allMovies,
                    );
                    console.log(`✅ Batch saved successfully\n`);
                    allMovies.length = 0; // Clear the array
                } catch (error) {
                    console.error("Failed to save batch:", error);
                    // If batch fails, try saving in smaller chunks
                    console.log(`⚠️  Attempting to save in smaller chunks...`);
                    const chunkSize = 100;
                    for (let i = 0; i < allMovies.length; i += chunkSize) {
                        const chunk = allMovies.slice(i, i + chunkSize);
                        try {
                            await axiosInstance.post(
                                `${BASE_URL}/api/movies`,
                                chunk,
                            );
                            console.log(
                                `✅ Saved chunk ${Math.floor(i / chunkSize) + 1} (${chunk.length} movies)`,
                            );
                        } catch (chunkError) {
                            console.error(
                                `Failed to save chunk ${Math.floor(i / chunkSize) + 1}:`,
                                chunkError,
                            );
                        }
                    }
                    allMovies.length = 0; // Clear the array after chunking
                }
            }

            // Add delay between years to be respectful of rate limits
            await delay(500);
        }

        // Save any remaining movies
        if (allMovies.length > 0) {
            console.log(
                `\n💾 Saving final batch of ${allMovies.length} movies...`,
            );
            try {
                await axiosInstance.post(`${BASE_URL}/api/movies`, allMovies);
                console.log(`✅ Final batch saved successfully`);
            } catch (error) {
                console.error("Failed to save final batch:", error);
                // If final batch fails, try saving in smaller chunks
                console.log(`⚠️  Attempting to save in smaller chunks...`);
                const chunkSize = 100;
                for (let i = 0; i < allMovies.length; i += chunkSize) {
                    const chunk = allMovies.slice(i, i + chunkSize);
                    try {
                        await axiosInstance.post(
                            `${BASE_URL}/api/movies`,
                            chunk,
                        );
                        console.log(
                            `✅ Saved chunk ${Math.floor(i / chunkSize) + 1} (${chunk.length} movies)`,
                        );
                    } catch (chunkError) {
                        console.error(
                            `Failed to save chunk ${Math.floor(i / chunkSize) + 1}:`,
                            chunkError,
                        );
                    }
                }
            }
        }

        console.log(`\n${"=".repeat(60)}`);
        console.log(`🎉 SEEDING COMPLETE!`);
        console.log(`${"=".repeat(60)}`);
        console.log(`📊 Summary:`);
        console.log(`   • Years processed: ${totalYears}`);
        console.log(`   • New movies added: ${totalNewMovies}`);
        console.log(`   • Duplicates skipped: ${totalSkipped}`);
        console.log(
            `   • Total: ${totalNewMovies + totalSkipped} movies fetched`,
        );
        console.log(`${"=".repeat(60)}\n`);

        return {
            success: true,
            yearsProcessed: totalYears,
            newMoviesAdded: totalNewMovies,
            duplicatesSkipped: totalSkipped,
            totalFetched: totalNewMovies + totalSkipped,
        };
    } catch (error) {
        console.error("Failed to fetch top movies:", error);
        throw error;
    }
};

// Convenience function to run the script easily
export const seedMovies = async () => {
    console.log("🚀 Starting movie database seeding...\n");
    console.log("⚠️  This will take a while (up to 10,000 movies)!\n");
    try {
        const result = await fetchTop100MoviesPerYearLast100Years();
        return result;
    } catch (error) {
        console.error("\n❌ Seeding failed:", error);
        throw error;
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
