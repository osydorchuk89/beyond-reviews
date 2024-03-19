import { DarkLink } from "../components/DarkLink";

export const Home = () => {
    return (
        <div className="flex flex-col justify-center items-center py-20 px-10 gap-20">
            <p className="text-5xl font-bold">Welcome to Beyond Reviews!</p>
            <p className="text-3xl text-center">
                Not just another social network. Not just another review
                website.
            </p>
            <p className="text-xl">
                <DarkLink text="Login to your account" link="/login" />
            </p>
            <p className="text-xl">Or</p>
            <p className="text-xl">
                Browse <DarkLink text="books" link="#" />,{" "}
                <DarkLink text="movies" link="#" />, or{" "}
                <DarkLink text="music" link="#" />
            </p>
        </div>
    );
};
