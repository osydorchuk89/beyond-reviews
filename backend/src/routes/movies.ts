import { Router } from "express";
import { Movie } from "../models/movie";

export const movieRouter = Router();

movieRouter.get("/", async (req, res) => {
    try {
        const movies = await Movie.find({});
        res.send(movies);
    } catch (error) {
        res.status(500).send({ message: "Could not fetch movies" });
    }
});

movieRouter.post("/", async (req, res) => {
    try {
        await Movie.insertMany(req.body);
        console.log("done");
    } catch (error) {
        console.log(error);
    }
});
