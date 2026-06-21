import { Request, Response } from "express";

import { PrismaClient } from "@prisma/client";
import {
    createOrUpdateBookReviewForUser,
    likeOrUnlikeBookReviewForUser,
} from "../services/bookReviews";
import { updateBookWishlist } from "../services/bookWishlist";
import { getErrorMessage, getErrorStatusCode } from "../services/errors";
import {
    fromBookWriteData,
    toBookResponse,
    toBookReviewResponse,
} from "../lib/media";

const prisma = new PrismaClient();

export const getAllBooks = async (
    req: Request,
    res: Response,
): Promise<any> => {
    try {
        const page = parseInt(req.query.page as string) ?? 1;
        const limit = parseInt(req.query.limit as string) ?? 15;
        const skip = (page - 1) * limit;

        const genre = req.query.genre as string;
        const releaseYear = req.query.releaseYear as string;
        const author = req.query.author as string;
        const sortBy = (req.query.sortBy as string) ?? "id";
        const sortOrder = (req.query.sortOrder as string) ?? "asc";
        const search = req.query.search as string;

        const whereClause: any = {};
        if (genre) {
            whereClause.genres = {
                has: genre,
            };
        }
        if (releaseYear) {
            whereClause.releaseYear = parseInt(releaseYear);
        }
        if (author) {
            whereClause.authors = {
                has: author,
            };
        }
        if (search) {
            whereClause.title = {
                contains: search,
                mode: "insensitive",
            };
        }

        const orderByClause: any = {};
        switch (sortBy) {
            case "numRatings":
                orderByClause.numRatings = sortOrder;
                break;
            case "releaseYear":
                orderByClause.releaseYear = sortOrder;
                break;
            case "avgRating":
                orderByClause.avgRating = sortOrder;
                break;
            case "id":
                orderByClause.id = sortOrder;
                break;
            default:
                orderByClause.id = "asc";
        }

        const [books, totalCount] = await Promise.all([
            prisma.book.findMany({
                where: whereClause,
                orderBy: orderByClause,
                skip,
                take: limit,
            }),
            prisma.book.count({ where: whereClause }),
        ]);

        res.status(200).send({
            books: books.map(toBookResponse),
            totalCount,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
            hasMore: page * limit < totalCount,
            appliedFilters: {
                genre,
                releaseYear,
                author,
                sortBy,
                sortOrder,
                search,
            },
        });
    } catch (error) {
        res.status(500).send({ message: "Could not fetch books", error });
    }
};

export const getBookById = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { bookId } = req.params;
    const userId =
        ((req.user as { id?: string } | undefined)?.id ??
            req.query.userId) as string | undefined;

    try {
        const book = await prisma.book.findUnique({
            where: {
                id: bookId,
            },
            include: {
                wishlistedByUsers: userId
                    ? {
                          where: {
                              userId,
                              mediaType: "BOOK",
                          },
                          select: {
                              userId: true,
                          },
                      }
                    : false,
            },
        });

        if (!book) {
            return res.status(404).send({ message: "Book not found" });
        }

        const { wishlistedByUsers, ...bookData } = book;
        res.status(200).send({
            ...toBookResponse(bookData),
            onWishlist: wishlistedByUsers,
        });
    } catch (error) {
        res.status(500).send({
            message: "Could not fetch book details",
            error,
        });
    }
};

export const addOrRemoveBookFromWishlist = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { bookId } = req.params;
    const { saved, userId } = req.body;

    try {
        await updateBookWishlist(prisma, {
            bookId,
            userId,
            saved,
        });
        res.status(200).send();
    } catch (error) {
        res.status(getErrorStatusCode(error)).send({
            message: getErrorMessage(error, "Could not update wishlist"),
            error,
        });
    }
};

export const getBookReviews = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { bookId } = req.params;
    const page = parseInt(req.query.page as string) ?? 1;
    const limit = parseInt(req.query.limit as string) ?? 10;
    const skip = (page - 1) * limit;
    const userId = req.query.userId as string | undefined;

    try {
        const include = {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                },
            },
            likedBy: {
                select: {
                    userId: true,
                },
            },
        };

        const [reviews, totalCount, userReview] = await Promise.all([
            prisma.review.findMany({
                where: { bookId, mediaType: "BOOK" },
                include,
                orderBy: {
                    likeCount: "desc",
                },
                skip,
                take: limit,
            }),
            prisma.review.count({
                where: { bookId, mediaType: "BOOK" },
            }),
            userId
                ? prisma.review.findFirst({
                      where: {
                          bookId,
                          userId,
                          mediaType: "BOOK",
                      },
                      include,
                  })
                : null,
        ]);

        const totalPages = Math.ceil(totalCount / limit);
        const hasMore = page < totalPages;

        res.status(200).send({
            reviews: reviews.map(toBookReviewResponse),
            totalCount,
            currentPage: page,
            totalPages,
            hasMore,
            userReview: userReview ? toBookReviewResponse(userReview) : userReview,
        });
    } catch (error) {
        res.status(500).send({ message: "Could not get book reviews", error });
    }
};

export const createOrUpdateBookReview = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { rating, text } = req.body;

    try {
        const bookReview = await createOrUpdateBookReviewForUser(prisma, {
            bookId: req.params.bookId,
            userId: req.body.userId,
            rating,
            text,
            date: req.body.date,
        });

        res.status(200).send(toBookReviewResponse(bookReview));
    } catch (error) {
        res.status(getErrorStatusCode(error)).send({
            message: getErrorMessage(error, "Could not create or update review"),
            error,
        });
    }
};

export const likeOrUnlikeBookReview = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const reviewId = req.params.reviewId;
    const { like, userId } = req.body;
    try {
        await likeOrUnlikeBookReviewForUser(prisma, {
            reviewId,
            userId,
            like,
        });
        res.status(200).send();
    } catch (error) {
        res.status(getErrorStatusCode(error)).send({
            message: getErrorMessage(error, "Could not like or unlike review"),
            error,
        });
    }
};

// For dev purposes only
export const createBooks = async (
    req: Request,
    res: Response,
): Promise<any> => {
    try {
        const books = Array.isArray(req.body) ? req.body : [req.body];
        const response = await Promise.all(
            books.map((book) => {
                const data = fromBookWriteData(book);
                return prisma.book.create({
                    data: {
                        ...(data as any),
                        authors: Array.isArray(book.authors) ? book.authors : [],
                    },
                });
            }),
        );
        res.send(response.map(toBookResponse));
    } catch (error) {
        res.status(500).send({
            message: "Could not create book",
            error,
        });
    }
};

// For dev purposes only
export const updateBook = async (
    req: Request,
    res: Response,
): Promise<any> => {
    const { bookId } = req.params;
    const updateData = fromBookWriteData(req.body);

    try {
        const updatedBook = await prisma.book.update({
            where: { id: bookId },
            data: updateData as any,
        });
        res.status(200).send(toBookResponse(updatedBook));
    } catch (error: any) {
        res.status(500).send({
            message: "Could not update book",
            error,
        });
    }
};
