import "dotenv/config";
import { MongoClient } from "mongodb";
import { migrateAuth } from "../lib/auth-migration.js";

const args = process.argv.slice(2);
if (
    args.some((arg) => arg !== "--apply" && arg !== "--dry-run") ||
    (args.includes("--apply") && args.includes("--dry-run"))
) {
    throw new Error("Usage: npm run auth:migrate -- [--dry-run | --apply]");
}
if (!process.env.DATABASE_URL)
    throw new Error("DATABASE_URL environment variable is not set");
const client = new MongoClient(process.env.DATABASE_URL);
try {
    await client.connect();
    console.log(await migrateAuth(client.db(), args.includes("--apply")));
} finally {
    await client.close();
}
