import { MediaCard } from "../media/MediaCard";
import { getMoviePoster } from "../../../lib/utils";

interface MovieCardProps {
    movieId: string;
    title: string;
    releaseYear: number;
    genres: string[];
    avgRating: number;
    numRatings: number;
    poster: string;
    hasShadow?: boolean;
}

export const MovieCard = ({
    movieId,
    title,
    releaseYear,
    genres,
    avgRating,
    numRatings,
    poster,
    hasShadow = true,
}: MovieCardProps) => {
    return (
        <MediaCard
            to={`/movies/${movieId}`}
            title={title}
            releaseYear={releaseYear}
            genres={genres}
            avgRating={avgRating}
            numRatings={numRatings}
            poster={getMoviePoster(poster)}
            posterAlt="movie poster"
            ratingCountSingular="vote"
            ratingCountPlural="votes"
            hasShadow={hasShadow}
        />
    );
};
