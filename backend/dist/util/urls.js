"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BASE_CLIENT_URL = exports.BASE_API_URL = exports.BASE_URL = void 0;
exports.BASE_URL = process.env.NODE_ENV === "production"
    ? "https://beyond-reviews.onrender.com/"
    : "http://localhost:3000/";
exports.BASE_API_URL = exports.BASE_URL + "api/";
exports.BASE_CLIENT_URL = process.env.NODE_ENV === "production"
    ? "https://beyond-reviews-smoc.onrender.com"
    : "http://localhost:5173";
