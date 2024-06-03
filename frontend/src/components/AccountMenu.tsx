import { Menu, Transition } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AuthStatus } from "../lib/types";
import { getAuthStatus, getUser, queryClient } from "../lib/requests";

interface AccountMenuProps {
    text: string;
}

const menuList = [
    { href: "/users/$userId/profile", text: "Profile" },
    { href: "/users/$userId/activity", text: "Activity" },
    { href: "#", text: "Friends" },
    { href: "/users/$userId/fav-movies", text: "Favorite Movies" },
    { href: "#", text: "Settings" },
];

export const AccountMenu = ({ text }: AccountMenuProps) => {
    const { data: authStatus } = useQuery<AuthStatus>({
        queryKey: ["authState"],
        queryFn: getAuthStatus,
        staleTime: 1000 * 60,
    });

    const userId = authStatus!.userData!._id;

    const prefetchUserData = (userId: string) => {
        queryClient.prefetchQuery({
            queryKey: ["users", { userId }],
            queryFn: () => getUser(userId),
            staleTime: 1000,
        });
    };

    return (
        <Menu
            as="div"
            className="flex flex-col items-center w-44 absolute right-44"
        >
            {({ open }) => (
                <>
                    <Menu.Button
                        className="w-12 h-12 rounded-full overflow-hidden bg-amber-300 mb-4"
                        onClick={() => {
                            !open && prefetchUserData(userId);
                        }}
                    >
                        {text}
                    </Menu.Button>
                    <Transition
                        className="w-full"
                        enter="transition duration-100 ease-out"
                        enterFrom="transform scale-95 opacity-0"
                        enterTo="transform scale-100 opacity-100"
                        leave="transition duration-75 ease-out"
                        leaveFrom="transform scale-100 opacity-100"
                        leaveTo="transform scale-95 opacity-0"
                    >
                        <Menu.Items className="flex flex-col rounded-md shadow-md w-full overflow-hidden">
                            {menuList.map((item) => (
                                <Menu.Item
                                    as={Link}
                                    key={item.text}
                                    to={item.href}
                                    className="p-4 ui-active:bg-amber-900 ui-active:text-amber-50 ui-not-active:bg-amber-300 ui-not-active:text-amber-950"
                                    params={{ userId }}
                                >
                                    {item.text}
                                </Menu.Item>
                            ))}
                        </Menu.Items>
                    </Transition>
                </>
            )}
        </Menu>
    );
};
