import { useQuery } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { getUser } from "../lib/requests";
import { User } from "../lib/types";

export const UserProfile = () => {
    const { userId } = useParams({ strict: false }) as { userId: string };

    const { data: userData } = useQuery<User>({
        queryKey: ["users", { userId }],
        queryFn: () => getUser(userId),
    });

    const userName = `${userData!.firstName} ${userData!.lastName}`;

    return (
        <div className="flex flex-col my-20 mx-60 p-5 rounded-lg shadow-lg bg-amber-100 gap-10">
            <p className="text-center text-2xl font-bold">Hello, {userName}</p>
            <img
                src={userData!.photo}
                className="object-cover object-top w-32 h-32 rounded-full self-center"
            />
            <ul className="flex flex-col items-center gap-5 text-lg">
                <li>Something</li>
                <li>Something else</li>
                <li>Something else entirely</li>
                <li>And finally</li>
            </ul>
        </div>
    );
};
