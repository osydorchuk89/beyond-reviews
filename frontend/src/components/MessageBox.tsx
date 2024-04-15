import { useQuery } from "@tanstack/react-query";
import { Popover } from "@headlessui/react";
import { MessageIcon } from "./MessageIcon";
import { CloseIconAlt } from "./CloseIconAlt";
import { getUsers } from "../lib/requests";

export const MessageBox = () => {
    const { data } = useQuery({
        queryKey: ["users"],
        queryFn: getUsers,
        enabled: false,
    });
    console.log(data);

    return (
        <Popover>
            <Popover.Button className="absolute top-7 right-[182px] cursor-pointer">
                <MessageIcon />
            </Popover.Button>
            <Popover.Panel className="absolute top-[90px] right-0 z-10 w-1/4 h-[87vh] overflow-auto bg-amber-50 rounded-md rounded-r-none shadow-md">
                <Popover.Button>
                    <CloseIconAlt className="w-8 h-8 absolute top-3 right-3" />
                </Popover.Button>
            </Popover.Panel>
        </Popover>
    );
};
