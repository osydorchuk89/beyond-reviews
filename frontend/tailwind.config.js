/** @type {import('tailwindcss').Config} */

const defaultTheme = require("tailwindcss/defaultTheme");

export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            lineClamp: {
                7: "7",
                8: "8",
                9: "9",
                10: "10",
            },
        },
        fontFamily: {
            sans: ["Roboto", "sans-serif"],
        },
        animation: {
            fade: "fadeIn .5s ease-in-out",
        },
        keyframes: {
            fadeIn: {
                from: { opacity: 0 },
                to: { opacity: 1 },
            },
        },
        screens: {
            xs: "400px",
            ...defaultTheme.screens,
        },
    },
    plugins: [require("@headlessui/tailwindcss")({ prefix: "ui" })],
};
