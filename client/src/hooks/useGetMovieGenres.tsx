import { QueryLink } from "../components/ui/QueryLink";

export const useGetMovieGenres = (
    genres: string[],
    onUserPage: boolean,
    handleQueryClick: (paramType: string, value: string) => void,
) => {
    return genres.length === 0 ? (
        <span>&nbsp;</span>
    ) : (
        genres.slice(0, 3).map((item, index) => (
            <span key={item}>
                {onUserPage ? (
                    <span>{item}</span>
                ) : (
                    <QueryLink onClick={() => handleQueryClick("genre", item)}>
                        {item}
                    </QueryLink>
                )}
                {index !== genres.slice(0, 3).length - 1 && " | "}
            </span>
        ))
    );
};
