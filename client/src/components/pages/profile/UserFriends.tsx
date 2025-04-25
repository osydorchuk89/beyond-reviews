import { useEffect, useState } from "react";
import { useParams, useRouteLoaderData } from "react-router";

import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { User } from "../../../lib/entities";
import { NavLink } from "../../ui/NavLink";
import { Button } from "../../ui/Button";
import { acceptFriendRequest, getUser } from "../../../lib/actions";
import { useAuthData } from "../../../hooks/useAuthData";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { triggerFriendEvent } from "../../../store";

export const UserFriends = () => {
    const { userId } = useParams() as { userId: string };
    const { user: initialUserData } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { authData, authDataFetching } = useAuthData();

    const [user, setUser] = useState(initialUserData);

    const isSameUser = (authData.user && user.id === authData.user.id) || false;
    const userName = `${user.firstName} ${user.lastName}`;

    const dispatch = useAppDispatch();
    const handleFriendRequest = async (userId: string, otherUserId: string) => {
        const date = new Date();
        await acceptFriendRequest(userId, otherUserId);
        dispatch(
            triggerFriendEvent(`new friend event at ${date.toISOString()}`)
        );
    };

    const friendEvent = useAppSelector((state) => state.friendEvent);
    useEffect(() => {
        const fetchUser = async () => {
            const user = await getUser(userId);
            setUser(user);
        };
        fetchUser();
    }, [friendEvent]);

    if (authDataFetching) {
        return (
            <div className="flex justify-center items-center min-h-[80vh]">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="flex flex-col my-20 mx-60 gap-10 min-h-[60vh]">
            <p className="text-2xl text-center font-bold">
                {isSameUser ? "Your" : `${userName}'s`} Friends
            </p>
            {user.receivedFriendRequests.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p className="text-xl font-medium text-center">
                        Received friend requests
                    </p>
                    <div className="flex flex-col p-5 rounded-lg shadow-lg bg-sky-100 gap-8">
                        <ul className="flex flex-col gap-4">
                            {user.receivedFriendRequests.map((request) => {
                                return (
                                    <li
                                        className="flex items-center justify-between text-lg border-b border-b-sky-700 py-2"
                                        key={request.sentUserId}
                                    >
                                        <div className="flex">
                                            <img
                                                src={request.sentUser.photo}
                                                className="object-cover object-top w-8 h-8 rounded-full self-center mr-2"
                                            />
                                            <NavLink
                                                text={`${request.sentUser.firstName} ${request.sentUser.lastName}`}
                                                to={`/users/${request.sentUserId}/profile`}
                                            />
                                        </div>
                                        {isSameUser && (
                                            <Button
                                                text="Accept friend request"
                                                style="sky"
                                                handleClick={() => {
                                                    handleFriendRequest(
                                                        user.id,
                                                        request.sentUserId
                                                    );
                                                }}
                                            />
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
            {user.sentFriendRequests.length > 0 && (
                <div className="flex flex-col gap-2">
                    <p className="text-xl font-medium text-center">
                        Sent friend requests
                    </p>
                    <div className="flex flex-col p-5 rounded-lg shadow-lg bg-sky-100 gap-8">
                        <ul className="flex flex-col gap-4">
                            {user.sentFriendRequests.map((request) => {
                                return (
                                    <li
                                        className="flex items-center justify-between text-lg border-b border-b-sky-700 py-2"
                                        key={request.receivedUserId}
                                    >
                                        <div className="flex">
                                            <img
                                                src={request.receivedUser.photo}
                                                className="object-cover object-top w-8 h-8 rounded-full self-center mr-2"
                                            />
                                            <NavLink
                                                text={`${request.receivedUser.firstName} ${request.receivedUser.lastName}`}
                                                to={`/users/${request.receivedUserId}/profile`}
                                            />
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-2">
                <p className="text-xl font-medium text-center">Friends</p>
                {user.friends.length > 0 ? (
                    <ul className="flex flex-col gap-5">
                        {user.friends.map((otherUser) => {
                            return (
                                <li
                                    key={otherUser.id}
                                    className="flex flex-col text-lg p-5 rounded-lg shadow-lg bg-sky-100 gap-8"
                                >
                                    <NavLink
                                        text={`${otherUser.firstName} ${otherUser.lastName}`}
                                        to={`/users/${otherUser.id}/profile`}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <p className="text-center">
                        {isSameUser ? "You have" : `${userName} has`} no friends
                        so far
                    </p>
                )}
            </div>
        </div>
    );
};
