import { useMutation, useQuery } from "@tanstack/react-query";
import { User } from "../lib/types";
import { useParams } from "@tanstack/react-router";
import { acceptFriendRequest, getUser, queryClient } from "../lib/requests";
import { DarkLink } from "./DarkLink";
import { Button } from "./Button";
import { useAppDispatch } from "../store/hooks";
import { popUpActions } from "../store";

export const UserFriends = () => {
    const { userId } = useParams({ strict: false }) as {
        userId: string;
    };

    const { data: userData } = useQuery<User>({
        queryKey: ["users", { userId }],
        queryFn: () => getUser(userId),
    });

    const { mutate: acceptFriendRequestFn } = useMutation({
        mutationFn: (otherUserId: string) =>
            acceptFriendRequest(userId, otherUserId),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["users", { userId }] }),
    });

    const dispatch = useAppDispatch();

    return (
        <div className="flex flex-col my-20 mx-60 gap-10">
            <p className="text-2xl text-center font-bold">Friends</p>
            {userData!.friendRequests.length > 0 && (
                <div className="flex flex-col p-5 rounded-lg shadow-lg bg-amber-100 gap-8">
                    <p className="text-xl font-medium">
                        Pending friend requests
                    </p>
                    <ul className="flex flex-col gap-4">
                        {userData!.friendRequests.map((user) => {
                            const otherUser = user as User;
                            return (
                                <li
                                    className="flex items-center justify-between text-lg border-b border-b-amber-700 py-2"
                                    key={otherUser._id}
                                >
                                    <div className="flex">
                                        <img
                                            src={otherUser.photo}
                                            className="object-cover object-top w-8 h-8 rounded-full self-center mr-2"
                                        />
                                        <DarkLink
                                            text={`${otherUser.firstName} ${otherUser.lastName}`}
                                            to={`/users/${otherUser._id}/profile`}
                                        />
                                    </div>
                                    <Button
                                        text="Accept friend request"
                                        style="dark"
                                        handleClick={() => {
                                            acceptFriendRequestFn(
                                                otherUser._id
                                            );
                                            dispatch(
                                                popUpActions.openAcceptedFriendRequestPopUp()
                                            );
                                        }}
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
            {userData!.friends.length > 0 && (
                <ul className="flex flex-col gap-5">
                    {userData!.friends.map((user) => {
                        const otherUser = user as User;
                        return (
                            <li
                                key={otherUser._id}
                                className="flex flex-col p-5 rounded-lg shadow-lg bg-amber-100 gap-8"
                            >
                                {otherUser.firstName} {otherUser.lastName}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
