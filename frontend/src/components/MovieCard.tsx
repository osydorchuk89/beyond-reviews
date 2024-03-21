interface MovieCardProps {
    title: string;
    releaseYear: number;
    overview: string;
    language: string;
    avgVote: number;
    numVotes: number;
    poster: string;
}

export const MovieCard = ({ ...props }: MovieCardProps) => {
    return (
        <div className="flex flex-col w-72 justify-start items-center border border-amber-950 rounded-lg p-5">
            <p className="text-center text-lg font-bold h-14 mb-2">
                {props.title} ({props.releaseYear})
            </p>
            <img
                src={`https://image.tmdb.org/t/p/w600_and_h900_bestv2/${props.poster}`}
                className="rounded-lg"
            />
            <p className="text-sm my-5 line-clamp-5 min-h-24">
                {props.overview}
            </p>
            <p>Average Vote: {props.avgVote}</p>
            <p>Number of Votes: {props.numVotes}</p>
        </div>
    );
};
