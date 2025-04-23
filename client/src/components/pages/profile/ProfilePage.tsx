import { useLoaderData } from "react-router";
import { User } from "../../../lib/entities";

export const ProfilePage = () => {
    let { user }: { user: User } = useLoaderData();

    return (
        <div className="flex flex-col my-20 mx-48 p-5 rounded-lg shadow-lg bg-sky-100 gap-10">
            <p className="text-center text-2xl font-bold">
                Hello, {user.firstName} {user.lastName}
            </p>
            <img
                src="https://beyond-reviews-os.s3.eu-central-1.amazonaws.com/user-icon.png"
                className="object-cover object-top w-32 h-32 rounded-full self-center"
            />
            <ul className="flex flex-col items-center gap-5 text-lg">
                <li>Reviews</li>
                <li>Favorites</li>
                <li>Friends</li>
                <li>Profile</li>
                <li>Settings</li>
            </ul>
        </div>
    );
};
