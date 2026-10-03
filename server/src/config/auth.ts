import "dotenv/config";
import { MongoClient } from "mongodb";
import { createAuth } from "../lib/auth-config.js";
import { BASE_CLIENT_URL } from "./constants.js";

const required = (name: string) => {
    const value = process.env[name];
    if (!value) throw new Error(`${name} environment variable is not set`);
    return value;
};

const secret = required("BETTER_AUTH_SECRET");
if (secret.length < 32) throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters");

export const AUTH_BASE_URL = process.env.BETTER_AUTH_URL ?? (
    process.env.NODE_ENV === "production"
        ? "https://beyond-reviews-193634881435.europe-west1.run.app"
        : "http://localhost:8080"
);

export const authMongoClient = new MongoClient(required("DATABASE_URL"));
export const auth = createAuth(authMongoClient.db(), authMongoClient, {
    secret,
    baseURL: AUTH_BASE_URL,
    clientURL: BASE_CLIENT_URL,
    production: process.env.NODE_ENV === "production",
    googleClientId: required("GOOGLE_CLIENT_ID"),
    googleClientSecret: required("GOOGLE_CLIENT_SECRET"),
});
