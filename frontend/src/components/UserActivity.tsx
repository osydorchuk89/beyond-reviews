import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Activity, AuthStatus, Movie, User } from "../lib/types";
import { getAuthStatus, getUserActivity } from "../lib/requests";
import { DarkLink } from "./DarkLink";
import { useRef } from "react";
import { useTruncatedElement } from "../hooks/useTuncatedElement";
import { Button } from "./Button";

export const UserActivity = () => {
    const { userId } = useParams({ strict: false }) as { userId: string };

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
    });

    const { data: activityData } = useQuery<Activity[]>({
        queryKey: ["activity", { userId }],
        queryFn: () => getUserActivity(userId),
    });

    const { userData } = authStatus!;

    const userName = `${userData!.firstName} ${userData!.lastName}`;

    const ref = useRef(null);
    const { isTruncated, isShowingMore, toggleIsShowingMore } =
        useTruncatedElement({
            ref,
        });

    const reversedActivityData = [...activityData!].reverse();

    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center my-20 mx-60 gap-10">
            <p className="text-center text-2xl font-bold">Activity</p>
            {reversedActivityData.length > 0 &&
                reversedActivityData!.map((activity) => {
                    let ratingUserName;
                    let ratingUserId;
                    if (activity.ratingId) {
                        const ratingUser = activity.ratingId.userId as User;
                        ratingUserName = `${ratingUser.firstName} ${ratingUser.lastName}`;
                        ratingUserId = ratingUser._id;
                    }
                    const activityDate = new Date(activity.date);
                    const parsedDate = activityDate.toLocaleString("default", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                    });

                    return (
                        <div
                            key={activity._id}
                            className="p-5 rounded-lg shadow-lg bg-amber-100"
                        >
                            <div className="flex justify-between">
                                <p className="flex items-center">
                                    <img
                                        src={userData!.photo}
                                        className="object-cover object-top w-8 h-8 rounded-full self-center mr-2"
                                    />
                                    {activity.movieId &&
                                        activity.action === "rated" && (
                                            <span className="font-bold">
                                                {userName} rated{" "}
                                                {activity.rating}
                                                /10{" "}
                                                <DarkLink
                                                    text={`${activity.movieId.title} (${activity.movieId.releaseYear})`}
                                                    to={`/movies/${activity.movieId._id}`}
                                                />
                                            </span>
                                        )}
                                    {activity.movieId &&
                                        activity.action !== "rated" && (
                                            <span className="font-bold">
                                                {userName}{" "}
                                                {activity.action === "saved"
                                                    ? "added"
                                                    : "removed"}{" "}
                                                <DarkLink
                                                    text={`${activity.movieId.title} (${activity.movieId.releaseYear})`}
                                                    to={`/movies/${activity.movieId._id}`}
                                                />{" "}
                                                {activity.action === "saved"
                                                    ? "to"
                                                    : "from"}{" "}
                                                watch list
                                            </span>
                                        )}
                                    {activity.ratingId && (
                                        <span className="font-bold">
                                            {userName}{" "}
                                            {activity.action === "liked"
                                                ? "liked"
                                                : "unliked"}{" "}
                                            a rating by{" "}
                                            <DarkLink
                                                text={ratingUserName!}
                                                to={`/users/${ratingUserId}/activity`}
                                            />{" "}
                                        </span>
                                    )}
                                </p>
                                <p>
                                    <span className="italic">{parsedDate}</span>
                                </p>
                            </div>
                            {activity.movieId && activity.review && (
                                <p className="mt-2">
                                    <strong>Review</strong>: {activity.review}
                                </p>
                            )}
                            {activity.movieId &&
                                activity.action === "rated" &&
                                !activity.review && (
                                    <p className="italic mt-2">No review</p>
                                )}
                            {activity.ratingId && (
                                <div className="mt-2">
                                    <p>
                                        <strong>Movie</strong>:{" "}
                                        <DarkLink
                                            text={`${(activity.ratingId.movieId as Movie).title} (${(activity.ratingId.movieId as Movie).releaseYear})`}
                                            to={`/movies/${(activity.ratingId.movieId as Movie)._id}`}
                                        />
                                    </p>
                                    <p>
                                        <strong>Rating</strong>:{" "}
                                        {`${activity.ratingId.movieRating}/10`}
                                    </p>
                                    <p>
                                        <strong>Review</strong>:{" "}
                                        {activity.ratingId.movieReview ? (
                                            <div>
                                                <span
                                                    ref={ref}
                                                    className={
                                                        !isShowingMore
                                                            ? "line-clamp-5 w-full"
                                                            : "w-full"
                                                    }
                                                >
                                                    {
                                                        activity.ratingId
                                                            .movieReview
                                                    }
                                                </span>
                                                {isTruncated && (
                                                    <div>
                                                        <Button
                                                            style="text-green-700 hover:text-green-950 text-sm font-medium uppercase"
                                                            text={
                                                                isShowingMore
                                                                    ? "Show less"
                                                                    : "Show more"
                                                            }
                                                            handleClick={
                                                                toggleIsShowingMore
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="italic">
                                                no review
                                            </span>
                                        )}
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            {reversedActivityData.length === 0 && (
                <div className="flex flex-col gap-10">
                    <p className="text-center text-lg">You have no activity</p>
                    <Button
                        text="Explore movies"
                        style="dark"
                        handleClick={() => navigate({ to: "/movies" })}
                    ></Button>
                </div>
            )}
        </div>
    );
};
