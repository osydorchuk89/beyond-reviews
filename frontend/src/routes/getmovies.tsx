import { createFileRoute } from "@tanstack/react-router";
import { fetchMovies } from "../lib/fetchRequests";

const GetMovies = () => {
    return (
        <div>
            <button onClick={() => fetchMovies(1)}>Get Movies</button>
            <button onClick={() => fetchMovies(2)}>Get Movies 2</button>
            <button onClick={() => fetchMovies(3)}>Get Movies 3</button>
            <button onClick={() => fetchMovies(4)}>Get Movies 4</button>
            <button onClick={() => fetchMovies(5)}>Get Movies 5</button>
        </div>
    );
};

export const Route = createFileRoute("/getmovies")({
    component: GetMovies,
});
