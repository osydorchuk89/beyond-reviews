import { addOrRemoveMovieFromWatchlist } from "../../../lib/api";
import { Movie, AuthData } from "../../../lib/entities";
import { MediaBookmark } from "../media/MediaBookmark";

interface MovieBookmarkProps {
    movie: Movie;
    authData: AuthData;
}

export const MovieBookmark = ({ movie, authData }: MovieBookmarkProps) => {
    return (
        <MediaBookmark
            item={movie}
            authData={authData}
            mediaLabel="Movie"
            addOrRemoveFromWishlist={addOrRemoveMovieFromWatchlist}
        />
    );
};
