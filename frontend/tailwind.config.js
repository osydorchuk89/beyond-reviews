/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        // extend: {
        //     lineClamp: {
        //         7: "7",
        //         8: "8",
        //         9: "9",
        //         10: "10",
        //     },
        // },
        fontFamily: {
            sans: ["Roboto", "sans-serif"],
        },
    },
    plugins: [require("@tailwindcss/line-clamp")],
};
