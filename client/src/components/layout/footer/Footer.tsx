import { horizontalPadding } from "../../../styles/responsive";

export const Footer = () => {
    return (
        <footer
            className={`bg-sky-800 min-h-24 flex flex-col sm:flex-row items-center sm:justify-between gap-8 sm:gap-0 pb-8 sm:pb-0 ${horizontalPadding.page} text-white`}
        >
            <ul className="flex flex-col items-center sm:flex-row sm:gap-8">
                <li>
                    <a href="#">About Us</a>
                </li>
                <li>
                    <a href="#">Contacts</a>
                </li>
                <li>
                    <a href="#">Privacy Policy</a>
                </li>
            </ul>
            <span>&copy; Beyond Reviews 2025</span>
        </footer>
    );
};
