import axios from "axios";

export const BASE_URL = import.meta.env.PROD
    ? "https://beyond-reviews-193634881435.europe-west1.run.app"
    : "http://localhost:8080";

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
});

export default axiosInstance;
