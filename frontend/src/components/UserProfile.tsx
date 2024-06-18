import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { addFriend, getAuthStatus, getUser } from "../lib/requests";
import { AuthStatus, User } from "../lib/types";
import { DarkLink } from "./DarkLink";
import { Button } from "./Button";

export const UserProfile = () => {
    const { userId } = useParams({ strict: false }) as {
        userId: string;
    };

    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
    });

    const { isAuthenticated, userData } = authStatus!;
    const isSameUser = userId === userData?._id;

    const { data: pageUserData } = useQuery<User>({
        queryKey: ["users", { userId }],
        queryFn: () => getUser(userId),
    });

    const userName = `${pageUserData!.firstName} ${pageUserData!.lastName}`;

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
                            !(userData!.friends as string[]).includes(
                                userId
                            ) && (
                                <li>
                                    <Button
                                        text="Add as a friend"
                                        style="dark"
                                        handleClick={() =>
                                            addFriend(
                                                userId,
                                                authStatus!.userData!._id
                                            )
                                        }
                                    />
                                </li>
                            )}
                    </>
                )}
            </ul>
        </div>
    );
};
