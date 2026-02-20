import { Link } from "react-router";
import { User } from "../../../lib/entities";

interface UserButtonProps {
    user: User;
}

export const UserButton = ({ user }: UserButtonProps) => {
    return (
        <Link to={`/users/${user?.id}/profile`}>
            <div className="flex justify-center items-center w-12 h-12 rounded-full overflow-hidden bg-orange-300 hover:bg-orange-500 cursor-pointer">
                <p className="text-orange-950">
                    {user.firstName[0] + user.lastName[0]}
                </p>
            </div>
        </Link>
    );
};
