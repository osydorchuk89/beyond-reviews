import { MediaCard } from "../media/MediaCard";

interface BookCardProps {
    bookId: string;
    title: string;
    releaseYear: number;
    authors: string[];
    genres: string[];
    avgRating: number;
    numRatings: number;
    poster: string;
}

export const BookCard = ({
    bookId,
    title,
    releaseYear,
    authors,
    genres,
    avgRating,
    numRatings,
    poster,
}: BookCardProps) => {
    const displayedAuthors =
        authors.length === 0 ? "Unknown author" : authors.slice(0, 2).join(", ");

    return (
        <MediaCard
            to={`/books/${bookId}`}
            title={title}
            subtitle={displayedAuthors}
            releaseYear={releaseYear}
            genres={genres}
            genreLimit={2}
            avgRating={avgRating}
            numRatings={numRatings}
            poster={poster || "/images/fallback-movie-poster.jpg"}
            posterAlt={`${title} cover`}
            ratingCountSingular="review"
            ratingCountPlural="reviews"
            imageClassName="rounded-lg h-[360px] w-[240px] object-cover"
        />
    );
};
