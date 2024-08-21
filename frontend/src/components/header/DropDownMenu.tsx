import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { MenuIcon } from "../icons/MenuIcon";

export const DropDownMenu = () => {
    return (
        <Menu>
            <MenuButton>
                <MenuIcon />
            </MenuButton>
            <MenuItems
                anchor="bottom end"
                className="mt-10 p-10 bg-amber-200 rounded-lg flex flex-col gap-10"
            >
                <MenuItem>
                    <a className="block data-[focus]:bg-blue-100" href="/#">
                        Books
                    </a>
                </MenuItem>
                <MenuItem>
                    <a
                        className="block data-[focus]:bg-blue-100"
                        href="/movies"
                    >
                        Movies
                    </a>
                </MenuItem>
                <MenuItem>
                    <a className="block data-[focus]:bg-blue-100" href="/#">
                        Music
                    </a>
                </MenuItem>
            </MenuItems>
        </Menu>
    );
};
