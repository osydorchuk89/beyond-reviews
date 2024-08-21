const bottomLinks = "text-sm";

export const BottomNavBar = () => {
    return (
        <footer className="bg-amber-50 w-full flex items-center justify-between p-5">
            <span className={bottomLinks}>&copy; Beyond Reviews 2024</span>
            <ul className="flex gap-10">
                <li>
                    <a className={bottomLinks}>About Us</a>
                </li>
                <li>
                    <a className={bottomLinks}>Contacts</a>
                </li>
                <li>
                    <a className={bottomLinks}>Privacy Policy</a>
                </li>
            </ul>
        </footer>
    );
};
