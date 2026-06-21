import { Router } from "express";

import {
    addOrRemoveBookFromWishlist,
    createBooks,
    createOrUpdateBookReview,
    getAllBooks,
    getBookById,
    getBookReviews,
    likeOrUnlikeBookReview,
    updateBook,
} from "../controllers/booksController";

export const booksRouter = Router();

// get all books
booksRouter.get("/", getAllBooks);

// get a specific book
booksRouter.get("/:bookId", getBookById);

// update a book (for dev purposes - e.g., backfilling data)
booksRouter.patch("/:bookId", updateBook);

// add/remove a book on/from a wishlist
booksRouter.put("/:bookId", addOrRemoveBookFromWishlist);

// get reviews of a specific book
booksRouter.get("/:bookId/reviews", getBookReviews);

// post or update a book review
booksRouter.post("/:bookId/reviews", createOrUpdateBookReview);

// like or unlike a book review
booksRouter.put("/:bookId/reviews/:reviewId", likeOrUnlikeBookReview);

// add books to database for dev purposes
booksRouter.post("/", createBooks);
