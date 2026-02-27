import { horizontalPadding, textSizes } from "../../../styles/responsive";
import { ButtonLink } from "../../ui/ButtonLink";

export const HeroSection = () => {
    return (
        <div
            className={`bg-sky-800 flex gap-8 py-20 ${horizontalPadding.page} text-white min-h-[80vh]`}
        >
            <div className="flex flex-col gap-20 w-full sm:w-1/2">
                <p
                    className={`${textSizes.heroTitle} font-bold text-center sm:text-start`}
                >
                    Discover, Review, Connect
                </p>
                <p className={`${textSizes.heroBody}`}>
                    Dive into books, movies, and music with personalized
                    ratings, real user insights, and a community that shares
                    your taste. Find friends, spark conversations, and go{" "}
                    <span className="italic">beyond</span> ordinary reviews!
                </p>
                <div className="flex justify-center sm:justify-start">
                    <ButtonLink style="orange" to="/movies">
                        START BROWSING
                    </ButtonLink>
                </div>
            </div>
            <div className="hidden sm:block sm:w-1/2 ">
                <img
                    src="images/hero-image.png"
                    alt="Two people discussing a book they read"
                    className="rounded-xl"
                />
            </div>
        </div>
    );
};
