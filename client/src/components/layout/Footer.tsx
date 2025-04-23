export const Footer = () => {
    return (
        <footer className="bg-sky-800 h-24 flex items-center justify-between px-48 text-white">
            <span>&copy; Beyond Reviews 2025</span>
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
        </footer>
    );
};
