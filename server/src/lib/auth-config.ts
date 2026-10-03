import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import bcrypt from "bcryptjs";
import type { Db, MongoClient } from "mongodb";
import { DEFAULT_USER_PHOTO_URL } from "../config/constants.js";

export const AUTH_COLLECTIONS = {
    user: "User", account: "AuthAccount", session: "AuthSession", verification: "AuthVerification",
} as const;

export const createAuth = (db: Db, client: MongoClient, config: {
    secret: string; baseURL: string; clientURL: string; production: boolean;
    googleClientId: string; googleClientSecret: string;
}) => betterAuth({
    appName: "Beyond Reviews",
    secret: config.secret,
    baseURL: config.baseURL,
    basePath: "/api/auth",
    database: mongodbAdapter(db, { client }),
    trustedOrigins: [config.clientURL],
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        requireEmailVerification: false,
        minPasswordLength: 8,
        // The existing registration schema has no maximum length.
        maxPasswordLength: Number.MAX_SAFE_INTEGER,
        password: {
            hash: (password) => bcrypt.hash(password, 12),
            verify: ({ hash, password }) => bcrypt.compare(password, hash),
        },
    },
    socialProviders: {
        google: {
            clientId: config.googleClientId,
            clientSecret: config.googleClientSecret,
            mapProfileToUser: (profile) => ({
                firstName: profile.given_name ?? "",
                lastName: profile.family_name ?? "",
                image: profile.picture || DEFAULT_USER_PHOTO_URL,
            }),
        },
    },
    user: {
        modelName: AUTH_COLLECTIONS.user,
        fields: { image: "photo" },
        additionalFields: {
            firstName: { type: "string", required: true },
            lastName: { type: "string", required: true },
            friendsIds: { type: "string[]", defaultValue: [], input: false, returned: false },
            friendOfIds: { type: "string[]", defaultValue: [], input: false, returned: false },
        },
    },
    account: {
        modelName: AUTH_COLLECTIONS.account,
        encryptOAuthTokens: true,
        accountLinking: {
            enabled: true,
            // Only provider-verified emails can implicitly link existing users.
            trustedProviders: [],
            // Legacy credential accounts never required email verification.
            // Google must still verify the matching email before linking.
            requireLocalEmailVerified: false,
            allowDifferentEmails: false,
            updateUserInfoOnLink: false,
        },
    },
    session: {
        modelName: AUTH_COLLECTIONS.session,
        expiresIn: 24 * 60,
        disableSessionRefresh: true,
        cookieCache: { enabled: false },
    },
    verification: { modelName: AUTH_COLLECTIONS.verification },
    advanced: {
        useSecureCookies: config.production,
        defaultCookieAttributes: {
            httpOnly: true,
            secure: config.production,
            sameSite: config.production ? "none" : "lax",
        },
    },
    onAPIError: { errorURL: `${config.clientURL}/login` },
});

export type AppAuth = ReturnType<typeof createAuth>;
