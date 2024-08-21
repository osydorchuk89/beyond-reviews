import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import {
    sendFriendRequest,
    getAuthStatus,
    getUser,
    queryClient,
    acceptFriendRequest,
} from "../../lib/requests";
import { AuthStatus, User } from "../../lib/types";
import { DarkLink } from "../DarkLink";
import { Button } from "../Button";
import { useAppDispatch } from "../../store/hooks";
import { popUpActions } from "../../store";

export const UserProfile = () => {
    const { userId } = useParams({ strict: false }) as {
        userId: string;
    };

    let visitingUser: User | undefined;
    // let visitingUserId = "";

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
    });

    if (authStatus!.isAuthenticated) {
        visitingUser = authStatus!.userData!;
        // visitingUserId = authStatus!.userData!._id;
    }

    const { isAuthenticated, userData } = authStatus!;
    const isSameUser = userId === userData?._id;

    const { data: pageUserData } = useQuery<User>({
        queryKey: ["users", { userId }],
        queryFn: () => getUser(userId),
    });

    const userName = `${pageUserData!.firstName} ${pageUserData!.lastName}`;

    const { mutate: sendFriendRequestFn } = useMutation({
        mutationFn: () => sendFriendRequest(userId, authStatus!.userData!._id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["users", { userId }] }),
    });

    const { mutate: acceptFriendRequestFn } = useMutation({
        mutationFn: () =>
            acceptFriendRequest(userId, authStatus!.userData!._id),
        onSuccess: () =>
            queryClient.invalidateQueries({ queryKey: ["users", { userId }] }),
    });

    const dispatch = useAppDispatch();

    console.log(pageUserData!.receivedFriendRequests);
    console.log(visitingUser!.receivedFriendRequests);

    return (
        <div className="flex flex-col my-20 mx-60 p-5 rounded-lg shadow-lg bg-amber-100 gap-10">
            <p className="text-center text-2xl font-bold">
                {isSameUser ? `Hello, ${userName}` : `${userName}'s profile`}
            </p>
            <img
                src={pageUserData!.photo}
                className="object-cover object-top w-32 h-32 rounded-full self-center"
            />
            <ul className="flex flex-col items-center gap-5 text-lg">
                {isSameUser ? (
                    <>
                        <li>Something</li>
                        <li>Something else</li>
                        <li>Something else entirely</li>
                        <li>And finally</li>
                    </>
                ) : (
                    <>
                        <li>
                            <DarkLink
                                text={`${userName}'s activity`}
                                to={`/users/${userId}/activity`}
                            />
                        </li>
                        <li>User ratings</li>
                        {isAuthenticated &&
                            !(
                                pageUserData!.receivedFriendRequests as User[]
                            ).some((user) => user._id === visitingUser!._id) &&
                            !(
                                visitingUser!.receivedFriendRequests as string[]
                            ).includes(userId) &&
                            !(pageUserData!.friends as User[]).some(
                                (user) => user._id === visitingUser!._id
                            ) && (
                                <li>
                                    <Button
                                        text="Send friend request"
                                        style="dark"
                                        handleClick={() => {
                                            sendFriendRequestFn();
                                            dispatch(
                                                popUpActions.openSentFriendRequestPopUp()
                                            );
                                        }}
                                    />
                                </li>
                            )}
                        {isAuthenticated &&
                            (
                                visitingUser!.receivedFriendRequests as string[]
                            ).includes(userId) && (
                                <li>
                                    <Button
                                        text="Accept friend request"
                                        style="dark"
                                        handleClick={() => {
                                            acceptFriendRequestFn();
                                            dispatch(
                                                popUpActions.openAcceptedFriendRequestPopUp()
                                            );
                                        }}
                                    />
                                </li>
                            )}
                    </>
                )}
            </ul>
        </div>
    );
};
