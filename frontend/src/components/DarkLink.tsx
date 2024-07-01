import { Link } from "@tanstack/react-router";

interface LinkProps {
    text: string;
    to: string;
    search?: (prevState: any) => any;
    resetScroll?: boolean;
}

export const DarkLink = ({ text, to, search, resetScroll }: LinkProps) => {
    return (
        <Link
            search={search}
            resetScroll={resetScroll}
            className="text-amber-700 font-bold hover:text-amber-950 hover:underline"
            to={to}
        >
            {text}
        </Link>
    );
};
