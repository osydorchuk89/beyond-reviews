import { Menu, Transition } from "@headlessui/react";
import { Link } from "@tanstack/react-router";

interface AccountMenuProps {
    text: string;
}

const menuList = [
    { href: "#", text: "My Profile" },
    { href: "#", text: "My Friends" },
    { href: "/movies", text: "Favorite Movies" },
    { href: "#", text: "My Reviews" },
    { href: "#", text: "Settings" },
];

export const AccountMenu = ({ text }: AccountMenuProps) => {
    return (
        <Menu
            as="div"
            className="flex flex-col items-center w-44 absolute right-44"
        >
            <Menu.Button className="w-12 h-12 rounded-full overflow-hidden bg-amber-300 mb-4">
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
                        >
                            {item.text}
                        </Menu.Item>
                    ))}
                </Menu.Items>
            </Transition>
        </Menu>
    );
};
