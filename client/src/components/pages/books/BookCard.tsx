import { MediaCard } from "../media/MediaCard";
import { useQueryClick } from "../../../hooks/useQueryClick";
import { QueryLink } from "../../ui/QueryLink";

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
    const handleQueryClick = useQueryClick();
    const displayedAuthor = authors[0];

    return (
        <MediaCard
            to={`/books/${bookId}`}
            title={title}
            subtitle={
                displayedAuthor ? (
                    <QueryLink
                        onClick={() =>
                            handleQueryClick("author", displayedAuthor)
                        }
                    >
                        {displayedAuthor}
                    </QueryLink>
                ) : (
                    "Unknown author"
                )
            }
            releaseYear={releaseYear}
            genres={genres}
            genreLimit={2}
            showGenres={false}
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
