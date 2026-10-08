import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import type { AppAuth } from "./auth-config.js";

export interface AuthUser {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photo: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export const toAppUser = (user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    image?: string | null;
}): AuthUser => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    photo: user.image ?? "",
});

export interface AuthResponse {
    user: Parameters<typeof toAppUser>[0];
    code?: string;
    message?: string;
    url?: string;
}

export const readAuthResponse = async (response: globalThis.Response) =>
    (await response.json()) as AuthResponse;

export const forwardCookies = (
    response: globalThis.Response,
    res: Response,
) => {
    const cookies = response.headers.getSetCookie();
    if (cookies.length) res.append("Set-Cookie", cookies);
};

// Keep Better Auth's origin checks and rate limiting on compatibility endpoints.
export const callAuth = (
    auth: AppAuth,
    baseURL: string,
    req: Request,
    endpoint: string,
    body: Record<string, unknown>,
) => {
    const headers = fromNodeHeaders(req.headers);
    headers.delete("content-length");
    headers.delete("transfer-encoding");
    headers.set("content-type", "application/json");
    if (req.ip) headers.set("x-forwarded-for", req.ip);
    return auth.handler(
        new globalThis.Request(`${baseURL}/api/auth${endpoint}`, {
            method: "POST",
            headers,
            body: JSON.stringify(body),
        }),
    );
};

export const resolveAuthUser =
    (auth: AppAuth) =>
    async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const session = await auth.api.getSession({
                headers: fromNodeHeaders(req.headers),
            });
            req.user = session ? toAppUser(session.user) : undefined;
            next();
        } catch (error) {
            next(error);
        }
    };

export const safeReturnPath = (value: unknown, fallback = "/movies") => {
    if (
        typeof value !== "string" ||
        !value.startsWith("/") ||
        value.startsWith("//") ||
        // biome-ignore lint/suspicious/noControlCharactersInRegex: Reject control characters and backslashes in redirect paths.
        /[\\\u0000-\u001f\u007f]/.test(value)
    )
        return fallback;
    return value;
};
