import { useEffect, useState } from "react";

import { User } from "../lib/entities";
import { useAppSelector } from "../store/hooks";
import { getUser } from "../lib/actions";

export const useUserData = (userId: string, initialUserData: User) => {
    const [user, setUser] = useState<User>(initialUserData);
    const friendEvent = useAppSelector((state) => state.friendEvent);

    useEffect(() => {
        const fetchUser = async () => {
            const userData = await getUser(userId);
            setUser(userData);
        };
        fetchUser();
    }, [userId, friendEvent]);

    return { user, setUser };
};
