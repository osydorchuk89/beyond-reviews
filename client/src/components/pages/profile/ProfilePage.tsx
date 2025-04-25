import { useEffect, useState } from "react";
import { useParams, useRouteLoaderData } from "react-router";

import { NavLink } from "../../ui/NavLink";
import { Button } from "../../ui/Button";
import { useAuthData } from "../../../hooks/useAuthData";
import { getUser, sendFriendRequest } from "../../../lib/actions";
import { User } from "../../../lib/entities";
import { LoadingSpinner } from "../../ui/LoadingSpinner";
import { profileNavLinks } from "../../../lib/data";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { triggerFriendEvent } from "../../../store";

export const ProfilePage = () => {
    const { userId } = useParams() as { userId: string };
    const { user: initialUserData } = useRouteLoaderData("userProfile") as {
        user: User;
    };
    const { authData, authDataFetching } = useAuthData();

    const [user, setUser] = useState(initialUserData);

    const isSameUser = (authData.user && user.id === authData.user.id) || false;
    const friendRequestSent = user.receivedFriendRequests.some(
        (request) => request.sentUserId === authData.user.id
    );

    const areFriends =
        (authData.user &&
            user.friends.some((friend) => friend.id === authData.user.id)) ||
        false;

    const dispatch = useAppDispatch();
    const handleFriendRequest = async () => {
        const date = new Date();
        await sendFriendRequest(authData.user.id, user.id);
        dispatch(
            triggerFriendEvent(`new friend event at ${date.toISOString()}`)
        );
    };

    const friendEvent = useAppSelector((state) => state.friendEvent);
    console.log(friendEvent);
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
        <div className="flex flex-col justify-between my-20 mx-48 p-5 rounded-lg shadow-lg bg-sky-100 gap-10 min-h-[60vh]">
            <p className="text-center text-2xl font-bold">
                {user.firstName} {user.lastName}
            </p>
            <img
                src="https://beyond-reviews-os.s3.eu-central-1.amazonaws.com/user-icon.png"
                className="object-cover object-top w-32 h-32 rounded-full self-center"
            />
            <ul className="flex flex-col items-center gap-5 text-lg">
                {profileNavLinks.map((link) => (
                    <NavLink key={link.text} to={link.to} text={link.text} />
                ))}
            </ul>
            <div className="flex justify-center">
                {authData.user && !isSameUser && !areFriends && (
                    <Button
                        text={
                            friendRequestSent
                                ? "FRIEND REQUEST SENT"
                                : "SEND FRIEND REQUEST"
                        }
                        style={friendRequestSent ? "disabled" : "orange"}
                        handleClick={
                            friendRequestSent ? undefined : handleFriendRequest
                        }
                    />
                )}
                {areFriends && <p>You are friends!</p>}
            </div>
        </div>
    );
};
