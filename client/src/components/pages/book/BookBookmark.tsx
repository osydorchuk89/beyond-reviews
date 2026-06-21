import { addOrRemoveBookFromWishlist } from "../../../lib/api";
import { AuthData, Book } from "../../../lib/entities";
import { MediaBookmark } from "../media/MediaBookmark";

interface BookBookmarkProps {
    book: Book;
    authData: AuthData;
}

export const BookBookmark = ({ book, authData }: BookBookmarkProps) => {
    return (
        <MediaBookmark
            item={book}
            authData={authData}
            mediaLabel="Book"
            addOrRemoveFromWishlist={addOrRemoveBookFromWishlist}
        />
    );
};
