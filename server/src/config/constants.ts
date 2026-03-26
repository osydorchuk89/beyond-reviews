export const BASE_CLIENT_URL =
    process.env.NODE_ENV === "production"
        ? "https://beyond-reviews-smoc.onrender.com"
        : "http://localhost:5173";

export const DEFAULT_USER_PHOTO_URL =
    "https://storage.googleapis.com/run-sources-beyond-reviews-2-europe-west1/images/default_user_image.jpg";
