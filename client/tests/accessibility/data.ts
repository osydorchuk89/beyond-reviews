import type {
    Book,
    BookReview,
    Movie,
    MovieReview,
    User,
} from "../../src/lib/entities";

// Synthetic data only. These IDs and email addresses do not identify real accounts.
export const users = {
    populated: makeUser("populated-user", "Alex", "Reader"),
    empty: makeUser("new-user", "Sam", "Newcomer"),
    friend: makeUser("friend-user", "Jordan", "Friend"),
    received: makeUser("request-user", "Casey", "Requester"),
    suggested: makeUser("suggested-user", "Taylor", "Reviewer"),
};

function makeUser(id: string, firstName: string, lastName: string): User {
    return {
        id,
        firstName,
        lastName,
        email: `${id}@example.test`,
        photo: `/test-images/${id}.svg`,
        likes: [],
        watchList: [],
        receivedFriendRequests: [],
        sentFriendRequests: [],
        friends: [],
    };
}

users.populated.friends = [users.friend];
users.populated.receivedFriendRequests = [
    {
        id: "received-request",
        sentUserId: users.received.id,
        receivedUserId: users.populated.id,
        sentUser: users.received,
    },
];
users.populated.sentFriendRequests = [
    {
        id: "sent-request",
        sentUserId: users.populated.id,
        receivedUserId: users.suggested.id,
        receivedUser: users.suggested,
    },
];

export const books: Book[] = [
    "The Quiet Library",
    "A Long Journey",
    "New Horizons",
].map((title, index) => ({
    id: `book-${index + 1}`,
    title,
    releaseYear: 2020 + index,
    overview:
        "A synthetic book description for repeatable accessibility checks.",
    language: "English",
    genres: ["Fiction"],
    keywords: ["discovery"],
    authors: ["Morgan Author"],
    pageCount: 320,
    avgRating: 8,
    numRatings: 3,
    poster: `/test-images/book-${index + 1}.svg`,
    onWishlist: [{ userId: users.populated.id }],
}));

export const movies: Movie[] = [
    "The Open Road",
    "Evening Lights",
    "Beyond the Hills",
].map((title, index) => ({
    id: `movie-${index + 1}`,
    title,
    releaseYear: 2020 + index,
    director: "Morgan Director",
    overview:
        "A synthetic movie description for repeatable accessibility checks.",
    language: "English",
    genres: ["Drama"],
    cast: ["Robin Actor"],
    keywords: ["discovery"],
    runtime: 120,
    avgRating: 8,
    numRatings: 3,
    reviews: [],
    poster: `/test-images/movie-${index + 1}.svg`,
    onWishlist: [{ userId: users.populated.id }],
}));

const review = {
    userId: users.populated.id,
    user: users.populated,
    date: new Date("2026-10-01T12:00:00.000Z"),
    rating: 8,
    text: "Fixture review: clear characters and an enjoyable story.",
    likeCount: 1,
    likedBy: [{ userId: users.friend.id }],
};

export const bookReviews: BookReview[] = books.map((book) => ({
    ...review,
    id: `review-${book.id}`,
    bookId: book.id,
    book,
}));

export const movieReviews: MovieReview[] = movies.map((movie) => ({
    ...review,
    id: `review-${movie.id}`,
    movieId: movie.id,
    movie,
}));

export function paginated(items: readonly unknown[], page = 1) {
    return {
        currentPage: page,
        totalPages: items.length ? 1 : 0,
        totalCount: items.length,
        hasMore: false,
    };
}
