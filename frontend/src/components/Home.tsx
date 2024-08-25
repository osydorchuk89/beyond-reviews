import { useQuery } from "@tanstack/react-query";
import { AuthStatus } from "../lib/types";
import { getAuthStatus } from "../lib/requests";
import { DarkLink } from "./DarkLink";

export const Home = () => {
    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        staleTime: 1000 * 60,
    });

    const isAuthenticated = authStatus!.isAuthenticated;

    return (
        <div className="flex flex-col justify-center items-center py-20 px-10 gap-20">
            <p className="text-4xl text-center md:text-5xl font-bold">
                Welcome to Beyond Reviews!
            </p>
            <p className="text-2xl md:text-3xl text-center">
                Not just another social network. Not just another review
                website.
            </p>
            <p className="text-xl">
                <DarkLink
                    text={
                        isAuthenticated
                            ? "Go to your profile"
                            : "Login to your account"
                    }
                    to={isAuthenticated ? "/#" : "/login"}
                />
            </p>
            <p className="text-xl">Or</p>
            <p className="text-xl">
                Browse <DarkLink text="books" to="#" />,{" "}
                <DarkLink text="movies" to="/movies" />, or{" "}
                <DarkLink text="music" to="#" />
            </p>
        </div>
    );
};
