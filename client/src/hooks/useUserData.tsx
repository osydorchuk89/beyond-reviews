import { useEffect, useState } from "react";

import { User } from "../lib/entities";
import { useAppSelector } from "../store/hooks";
import { getUser } from "../lib/actions";

export const useUserData = (userId: string, initialUserData: User) => {
    const [user, setUser] = useState<User>(initialUserData);
    const [isLoading, setIsLoading] = useState(false);
    const friendEvent = useAppSelector((state) => state.friendEvent);

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            try {
                const userData = await getUser(userId);
                setUser(userData);
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [userId, friendEvent]);

    return { user, setUser, isLoading };
};
