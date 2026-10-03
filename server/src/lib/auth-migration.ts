import { MongoServerError, type Db, type Document } from "mongodb";
import { AUTH_COLLECTIONS } from "./auth-config.js";

// Add auth metadata and credential accounts in place. Never replace user
// documents, change IDs, overwrite account passwords, or touch domain data.
export const migrateAuth = async (db: Db, apply = false) => {
    const users = await db.collection(AUTH_COLLECTIONS.user).find().toArray();
    const emails = new Set<string>();
    for (const user of users) {
        if (typeof user.email !== "string" || !user.email.trim()) {
            throw new Error(`User ${user._id} has no valid email; migration stopped before writing`);
        }
        const email = user.email.trim().toLowerCase();
        if (emails.has(email)) {
            throw new Error("Case-insensitive duplicate emails found; migration stopped before writing. No users were merged.");
        }
        emails.add(email);
    }

    const accounts = db.collection(AUTH_COLLECTIONS.account);
    // Detect account/index conflicts before modifying users.
    const duplicateAccounts = await accounts.aggregate([
        { $group: { _id: { providerId: "$providerId", accountId: "$accountId" }, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $limit: 1 },
    ]).toArray();
    if (duplicateAccounts.length) throw new Error("Duplicate auth accounts found; migration stopped before writing");

    for (const user of users) {
        const existing = await accounts.findOne({ providerId: "credential", accountId: user._id.toHexString() });
        if (existing && !existing.userId?.equals(user._id)) {
            throw new Error(`Credential account ownership mismatch for user ${user._id}; migration stopped before writing`);
        }
    }

    if (apply) {
        // Prisma may have created this index under a different name already.
        const userIndexes = await db.collection(AUTH_COLLECTIONS.user).indexes().catch((error: unknown) => {
            if (error instanceof MongoServerError && error.code === 26) return [];
            throw error;
        });
        if (!userIndexes.some((index) => index.unique &&
            Object.keys(index.key).length === 1 && index.key.email === 1)) {
            await db.collection(AUTH_COLLECTIONS.user).createIndex({ email: 1 }, { unique: true });
        }
        await accounts.createIndex({ providerId: 1, accountId: 1 }, { unique: true });
        await accounts.createIndex({ userId: 1 });
        await db.collection(AUTH_COLLECTIONS.session).createIndex({ token: 1 }, { unique: true });
        await db.collection(AUTH_COLLECTIONS.session).createIndex({ userId: 1 });
        await db.collection(AUTH_COLLECTIONS.session).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
        await db.collection(AUTH_COLLECTIONS.verification).createIndex({ identifier: 1 });
        await db.collection(AUTH_COLLECTIONS.verification).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    }

    let credentialsCreated = 0;
    let usersUpdated = 0;
    for (const user of users) {
        const fields: Document = {};
        const normalizedEmail = user.email.trim().toLowerCase();
        if (user.email !== normalizedEmail) fields.email = normalizedEmail;
        if (user.name === undefined) fields.name = `${user.firstName} ${user.lastName}`.trim();
        if (user.emailVerified === undefined) fields.emailVerified = false;
        if (user.createdAt === undefined) fields.createdAt = user._id.getTimestamp();
        if (user.updatedAt === undefined) fields.updatedAt = user.createdAt ?? user._id.getTimestamp();
        if (Object.keys(fields).length) {
            usersUpdated++;
            if (apply) await db.collection(AUTH_COLLECTIONS.user).updateOne({ _id: user._id }, { $set: fields });
        }
        if (!user.password) continue;
        const filter = { providerId: "credential", accountId: user._id.toHexString() };
        if (await accounts.findOne(filter)) continue;
        credentialsCreated++;
        if (apply) await accounts.updateOne(filter, {
            $setOnInsert: {
                ...filter, userId: user._id, password: user.password,
                createdAt: new Date(), updatedAt: new Date(),
            },
        }, { upsert: true });
    }
    return { mode: apply ? "apply" : "dry-run", users: users.length, usersUpdated, credentialsCreated };
};
