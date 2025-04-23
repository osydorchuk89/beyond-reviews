import { useRouteLoaderData } from "react-router";
import { profileNavLinks } from "../../../lib/data";
import { NavLink } from "../../ui/NavLink";

export const ProfilePage = () => {
    const { user } = useRouteLoaderData("profile");

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
                {profileNavLinks.map((link) => (
                    <NavLink key={link.text} to={link.to} text={link.text} />
                ))}
            </ul>
        </div>
    );
};
