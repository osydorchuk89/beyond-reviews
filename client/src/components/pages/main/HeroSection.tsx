import { useNavigate } from "react-router";

import { Button } from "../../ui/Button";

export const HeroSection = () => {
    const navigate = useNavigate();

    return (
        <div className="bg-sky-800 flex gap-8 py-20 px-48 text-white">
            <div className="flex flex-col gap-20 w-1/2">
                <p className="text-6xl font-bold">Discover, Review, Connect</p>
                <p className="text-xl">
                    Dive into books, movies, and music with personalized
                    ratings, real user insights, and a community that shares
                    your taste. Find friends, spark conversations, and go{" "}
                    <span className="italic">beyond</span> ordinary reviews!
                </p>
                <div className="flex justify-start">
                    <Button
                        text="Start browsing"
                        style="orange"
                        handleClick={() => navigate("/movies")}
                    />
                </div>
            </div>
            <div className="w-1/2">
                <img
                    src="images/hero-image.png"
                    alt="Two people discussing a book they read"
                    className="rounded-xl"
                />
            </div>
        </div>
    );
};
