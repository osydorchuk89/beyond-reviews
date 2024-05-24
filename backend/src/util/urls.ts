export const BASE_URL =
    process.env.NODE_ENV === "production"
        ? "https://beyond-reviews.onrender.com/"
        : "http://localhost:3000/";
export const BASE_API_URL = BASE_URL + "api/";
export const BASE_CLIENT_URL =
    process.env.NODE_ENV === "production"
        ? "https://beyond-reviews-smoc.onrender.com"
        : "http://localhost:5173";
