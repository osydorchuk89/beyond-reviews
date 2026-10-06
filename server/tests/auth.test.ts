import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomBytes } from "node:crypto";
import type { Server } from "node:http";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import { MongoClient, ObjectId, type Db } from "mongodb";
import bcrypt from "bcryptjs";
import { migrateAuth } from "../src/lib/auth-migration.js";
import { createAuth, type AppAuth } from "../src/lib/auth-config.js";
import { safeReturnPath } from "../src/lib/auth-http.js";
import express from "express";

const origin = "http://localhost:5173";
const secret = randomBytes(32).toString("base64");
let mongo: MongoMemoryReplSet;
let client: MongoClient;
let db: Db;
let auth: AppAuth;
let server: Server;
let baseURL: string;
let appMongoClient: MongoClient;
let disconnectPrisma: () => Promise<void>;

const cookies = (response: Response) =>
    response.headers
        .getSetCookie()
        .map((cookie) => cookie.split(";")[0])
        .join("; ");
const post = (
    path: string,
    body: unknown,
    cookie = "",
    requestOrigin = origin,
) =>
    fetch(baseURL + path, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            origin: requestOrigin,
            cookie,
        },
        body: JSON.stringify(body),
        redirect: "manual",
    });

before(
    async () => {
        mongo = await MongoMemoryReplSet.create({
            binary: { version: "7.0.14" },
            replSet: { count: 1 },
        });
        const uri = mongo.getUri("auth_migration_test");
        client = await new MongoClient(uri).connect();
        db = client.db();
        process.env.DATABASE_URL = uri;
        process.env.BETTER_AUTH_SECRET = secret;
        process.env.BETTER_AUTH_URL = "http://localhost:8080";
        process.env.GOOGLE_CLIENT_ID = "test-client";
        process.env.GOOGLE_CLIENT_SECRET = "test-secret";
        process.env.CLIENT_URL = origin;
        process.env.NODE_ENV = "test";
        const { app } = await import("../src/app.js");
        const configuration = await import("../src/config/auth.js");
        auth = configuration.auth;
        appMongoClient = configuration.authMongoClient;
        const { prisma } = await import("../src/lib/prisma.js");
        disconnectPrisma = () => prisma.$disconnect();
        server = await new Promise<Server>((resolve) => {
            const listening = app.listen(0, "127.0.0.1", () =>
                resolve(listening),
            );
        });
        const address = server.address();
        assert(address && typeof address !== "string");
        baseURL = `http://127.0.0.1:${address.port}`;
    },
    { timeout: 180_000 },
);

after(async () => {
    if (server)
        await new Promise<void>((resolve) => server.close(() => resolve()));
    if (disconnectPrisma) await disconnectPrisma();
    await appMongoClient?.close();
    await client?.close();
    await mongo?.stop();
});

test("migration preserves recommendation data and bcrypt passwords, and can be rerun", async () => {
    const id = new ObjectId();
    const hash = await bcrypt.hash("existing-password", 12);
    const user = {
        _id: id,
        email: "Existing@Example.com",
        firstName: "Existing",
        lastName: "User",
        password: hash,
        photo: "https://example.com/avatar.jpg",
        friendsIds: [new ObjectId()],
        friendOfIds: [],
    };
    await db.collection("User").insertOne(user);
    await db
        .collection("User")
        .createIndex({ email: 1 }, { unique: true, name: "User_email_key" });
    const review = {
        _id: new ObjectId(),
        userId: id,
        movieId: new ObjectId(),
        rating: 9,
    };
    const bookReview = {
        _id: new ObjectId(),
        userId: id,
        bookId: new ObjectId(),
        rating: 8,
        mediaType: "BOOK",
    };
    await db.collection("MovieReview").insertMany([review, bookReview]);
    assert.equal((await migrateAuth(db)).credentialsCreated, 1);
    assert.deepEqual(await db.collection("User").findOne({ _id: id }), user);
    assert.equal(await db.collection("AuthAccount").countDocuments(), 0);
    assert.equal((await migrateAuth(db, true)).credentialsCreated, 1);
    assert.equal((await migrateAuth(db, true)).credentialsCreated, 0);
    const migrated = await db.collection("User").findOne({ _id: id });
    assert.equal(migrated?.password, hash);
    assert.equal(migrated?.email, "existing@example.com");
    assert.deepEqual(migrated?.friendsIds, user.friendsIds);
    assert.deepEqual(await db.collection("MovieReview").find().toArray(), [
        review,
        bookReview,
    ]);
    const account = await db
        .collection("AuthAccount")
        .findOne({ providerId: "credential", userId: id });
    assert.equal(account?.password, hash);
    const login = await post("/auth/login", {
        email: "existing@example.com",
        password: "existing-password",
    });
    assert.equal(login.status, 200, await login.clone().text());
    assert.equal((await login.json()).id, id.toHexString());
    const status = await fetch(baseURL + "/auth/status", {
        headers: { cookie: cookies(login) },
    });
    const data = await status.json();
    assert.equal(data.isAuthenticated, true);
    assert.equal(data.user.photo, user.photo);
    assert.equal(data.user.password, undefined);
    assert.equal(
        (await post("/auth/login", { email: user.email, password: "wrong" }))
            .status,
        401,
    );
});

test("duplicate emails stop migration before writing or merging accounts", async () => {
    const isolated = client.db("duplicate_email_test");
    const users = [
        { _id: new ObjectId(), email: "Duplicate@example.com" },
        { _id: new ObjectId(), email: "duplicate@example.com" },
    ];
    await isolated.collection("User").insertMany(users);
    await assert.rejects(migrateAuth(isolated, true), /duplicate emails/);
    assert.deepEqual(await isolated.collection("User").find().toArray(), users);
});

test("migration on a fresh database creates the auth indexes without deleting anything", async () => {
    const isolated = client.db("empty_auth_test");
    assert.deepEqual(await migrateAuth(isolated, true), {
        mode: "apply",
        users: 0,
        usersUpdated: 0,
        credentialsCreated: 0,
    });
    assert(
        (await isolated.collection("AuthAccount").indexes()).some(
            (index) => index.unique,
        ),
    );
});

test("registration retains an uploaded photo URL", async () => {
    // Exercise the registration controller with the file metadata that the
    // unchanged GCS middleware supplies, without uploading to the real bucket.
    const { registerNewUser } = await import(
        "../src/controllers/usersController.js"
    );
    const app = express();
    app.use(express.json());
    app.post("/", (req, res) => {
        req.file = {
            location: "https://example.com/uploaded-avatar.jpg",
        } as Express.Multer.File;
        return registerNewUser(req, res);
    });
    const photoServer = await new Promise<Server>((resolve) => {
        const listening = app.listen(0, "127.0.0.1", () => resolve(listening));
    });
    try {
        const address = photoServer.address();
        assert(address && typeof address !== "string");
        const response = await fetch(`http://127.0.0.1:${address.port}/`, {
            method: "POST",
            headers: { origin, "content-type": "application/json" },
            body: JSON.stringify({
                firstName: "Photo",
                lastName: "User",
                email: "photo@example.com",
                password: "photo-password",
            }),
        });
        assert.equal(response.status, 200, await response.clone().text());
        assert.equal(
            (await response.json()).photo,
            "https://example.com/uploaded-avatar.jpg",
        );
        assert.equal(
            (
                await db
                    .collection("User")
                    .findOne({ email: "photo@example.com" })
            )?.photo,
            "https://example.com/uploaded-avatar.jpg",
        );
    } finally {
        await new Promise<void>((resolve) =>
            photoServer.close(() => resolve()),
        );
    }
});

test("registration creates a Prisma-readable profile and session; logout and expiry invalidate it", async () => {
    const form = new FormData();
    for (const [key, value] of Object.entries({
        firstName: "New",
        lastName: "User",
        email: "new@example.com",
        password: "new-password",
    }))
        form.set(key, value);
    const response = await fetch(baseURL + "/api/users/", {
        method: "POST",
        headers: { origin },
        body: form,
    });
    assert.equal(response.status, 200, await response.clone().text());
    const user = await response.json();
    assert.match(user.id, /^[a-f0-9]{24}$/);
    assert.match(user.photo, /default_user_image/);
    assert.equal(user.password, undefined);
    const profile = await fetch(baseURL + `/api/users/${user.id}`);
    assert.equal(profile.status, 200, await profile.clone().text());
    assert.equal((await profile.json()).firstName, "New");
    const cookie = cookies(response);
    assert(cookie.includes("better-auth.session_token"));
    assert(
        response.headers
            .getSetCookie()
            .some((value) => value.includes("Max-Age=1440")),
    );
    const duplicate = await fetch(baseURL + "/api/users/", {
        method: "POST",
        headers: { origin },
        body: form,
    });
    assert.equal(duplicate.status, 409);
    assert.equal(
        (
            await fetch(baseURL + "/auth/status", { headers: { cookie } }).then(
                (r) => r.json(),
            )
        ).isAuthenticated,
        true,
    );
    assert.equal((await post("/auth/logout", {}, cookie)).status, 200);
    assert.equal(
        (
            await fetch(baseURL + "/auth/status", { headers: { cookie } }).then(
                (r) => r.json(),
            )
        ).isAuthenticated,
        false,
    );
    const login = await post("/auth/login", {
        email: "new@example.com",
        password: "new-password",
    });
    await db
        .collection("AuthSession")
        .updateMany(
            { userId: new ObjectId(user.id) },
            { $set: { expiresAt: new Date(0) } },
        );
    assert.equal(
        (
            await fetch(baseURL + "/auth/status", {
                headers: { cookie: cookies(login) },
            }).then((r) => r.json())
        ).isAuthenticated,
        false,
    );
    const session = await post("/auth/login", {
        email: "new@example.com",
        password: "new-password",
    });
    const forbidden = await post(
        "/auth/logout",
        {},
        cookies(session),
        "https://untrusted.example",
    );
    assert.equal(forbidden.status, 403);
    assert.equal(
        (
            await fetch(baseURL + "/auth/status", {
                headers: { cookie: cookies(session) },
            }).then((r) => r.json())
        ).isAuthenticated,
        true,
    );
});

test("Google links existing users without changing profiles and creates new Google users", async () => {
    const context = await auth.$context;
    const provider = context.socialProviders.find(
        (provider) => provider.id === "google",
    )!;
    const originalValidate = provider.validateAuthorizationCode;
    const originalUserInfo = provider.getUserInfo;
    let email = "existing@example.com";
    let googleId = "google-existing-id";
    let verified = true;
    provider.validateAuthorizationCode = async () => ({
        accessToken: "test-token",
        scopes: ["email", "profile"],
    });
    provider.getUserInfo = async () => ({
        user: {
            id: googleId,
            email,
            emailVerified: verified,
            name: "Google Name",
            firstName: "Google",
            lastName: "Name",
            image: "https://example.com/google.jpg",
        },
        data: { sub: googleId, email, email_verified: verified },
    });
    const oauth = async (from = "/books") => {
        const start = await fetch(
            baseURL + `/auth/google?from=${encodeURIComponent(from)}`,
            { redirect: "manual" },
        );
        assert.equal(start.status, 302);
        const location = new URL(start.headers.get("location")!);
        assert.equal(
            location.searchParams.get("redirect_uri"),
            "http://localhost:8080/api/auth/callback/google",
        );
        const state = location.searchParams.get("state")!;
        return fetch(
            baseURL +
                `/api/auth/callback/google?code=test&state=${encodeURIComponent(state)}`,
            {
                redirect: "manual",
                headers: { cookie: cookies(start) },
            },
        );
    };
    try {
        const existing = await db.collection("User").findOne({ email });
        const linked = await oauth();
        assert.equal(
            linked.headers.get("location"),
            origin + "/books",
            await linked.clone().text(),
        );
        const linkedAccount = await db
            .collection("AuthAccount")
            .findOne({ accountId: googleId, providerId: "google" });
        assert(linkedAccount?.userId.equals(existing?._id));
        assert.notEqual(linkedAccount?.accessToken, "test-token");
        const unchanged = await db.collection("User").findOne({ email });
        assert.equal(unchanged?.firstName, existing?.firstName);
        assert.equal(unchanged?.photo, existing?.photo);
        assert.equal(
            (
                await fetch(baseURL + "/auth/status", {
                    headers: { cookie: cookies(linked) },
                }).then((r) => r.json())
            ).user.id,
            existing?._id.toHexString(),
        );
        email = "google-only@example.com";
        googleId = "new-google-id";
        const created = await oauth();
        assert.equal(created.headers.get("location"), origin + "/books");
        const googleUser = await db.collection("User").findOne({ email });
        assert.equal(googleUser?.firstName, "Google");
        assert.deepEqual(googleUser?.friendsIds, []);
        assert.equal(
            (await post("/auth/login", { email, password: "new-password" }))
                .status,
            401,
        );
        await oauth();
        assert.equal(await db.collection("User").countDocuments({ email }), 1);
        // A legacy Google-only user has no credential or provider account yet.
        const legacyId = new ObjectId();
        email = "legacy-google@example.com";
        googleId = "legacy-google-subject";
        await db
            .collection("User")
            .insertOne({
                _id: legacyId,
                firstName: "Legacy",
                lastName: "Google",
                email,
                photo: "https://example.com/legacy.jpg",
                friendsIds: [],
                friendOfIds: [],
            });
        await migrateAuth(db, true);
        assert.equal(
            (await oauth()).headers.get("location"),
            origin + "/books",
        );
        assert.equal(await db.collection("User").countDocuments({ email }), 1);
        assert(
            (
                await db
                    .collection("AuthAccount")
                    .findOne({ accountId: googleId })
            )?.userId.equals(legacyId),
        );
        email = "new@example.com";
        googleId = "unverified-google-id";
        verified = false;
        const denied = await oauth();
        assert(denied.headers.get("location")?.startsWith(origin + "/login?"));
        assert.equal(
            await db
                .collection("AuthAccount")
                .countDocuments({ accountId: googleId }),
            0,
        );
        const invalidState = await fetch(
            baseURL + "/api/auth/callback/google?code=test&state=invalid",
            { redirect: "manual" },
        );
        assert(
            invalidState.headers
                .get("location")
                ?.startsWith(origin + "/login?"),
        );
    } finally {
        provider.validateAuthorizationCode = originalValidate;
        provider.getUserInfo = originalUserInfo;
    }
});

test("production sessions use secure cross-site cookies; redirects reject external targets", async () => {
    const production = createAuth(db, client, {
        secret,
        baseURL: "https://api.example.com",
        clientURL: "https://app.example.com",
        production: true,
        googleClientId: "test",
        googleClientSecret: "test",
    });
    const response = await production.handler(
        new Request("https://api.example.com/api/auth/sign-in/email", {
            method: "POST",
            headers: {
                "content-type": "application/json",
                origin: "https://app.example.com",
            },
            body: JSON.stringify({
                email: "new@example.com",
                password: "new-password",
            }),
        }),
    );
    assert.equal(response.status, 200);
    const cookie = response.headers
        .getSetCookie()
        .find((value) => value.includes("session_token"))!;
    assert.match(cookie, /Secure/i);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=None/i);
    assert.equal(safeReturnPath("/books?page=2"), "/books?page=2");
    for (const path of [
        "//evil.example",
        "/\\evil.example",
        "https://evil.example",
        "/\n/evil.example",
    ]) {
        assert.equal(safeReturnPath(path), "/movies");
    }
});
