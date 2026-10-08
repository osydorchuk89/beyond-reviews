# Beyond Reviews

A full-stack web application for reviewing movies built with React, express, and MongoDB. The live app is available [here](https://beyond-reviews-smoc.onrender.com/).

## AI / Contributor Context

Before starting code changes, read [AGENTS.md](AGENTS.md) for the product direction, architecture notes, local workflows, and guidance for future AI agent sessions.

## Features

- User authentication with email/password and Google OAuth
- Browse and filter movies by genre, year, and director
- Rate and review movies
- User profiles and watchlists
- Messaging between users
- Friend system and activity feeds

## Tech Stack

**Frontend:**

- React 18 with TypeScript
- React Router v7
- Tailwind CSS for styling

**Backend:**

- Node.js with express
- TypeScript
- Prisma ORM with MongoDB
- Better Auth for authentication (native MongoDB adapter)

## Local Installation

### Prerequisites

Before running this application, make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/) (local installation or MongoDB Atlas account)
- [Git](https://git-scm.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/osydorchuk89/beyond-reviews.git
cd beyond-reviews
```

### 2. Set Up the Server

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the server directory and add the following environment variables:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` (random secret of at least 32 characters)
- `BETTER_AUTH_URL` (backend origin; defaults to the existing local/production backend URL)
- `CLIENT_URL` (frontend origin; defaults to the existing local/production frontend URL)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GCS_BUCKET_NAME`
- `GOOGLE_APPLICATION_CREDENTIALS` (local path to your Google service account key JSON file)
- `GCS_PUBLIC_BASE_URL` (optional, if using a CDN or custom domain)

Generate `BETTER_AUTH_SECRET` locally and store the result in your `.env` or hosting secret configuration:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Keep the same secret across server instances and restarts. `EXPRESS_SESSION_SECRET` is no longer used. MongoDB must support transactions (Atlas or a replica set), as required by the existing Prisma setup and the Better Auth adapter.

### Authentication migration and deployment

Existing accounts are retained in the `User` collection with their original ObjectIds. Better Auth uses separate `AuthAccount`, `AuthSession`, and `AuthVerification` collections. Prisma remains on v6, with no Prisma schema change.

Before starting the migrated app against an existing database:

1. Back up the database and pause the old backend's writes during cutover.
2. Set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, and `CLIENT_URL` in the backend environment. Keep the existing Google credentials and database URL.
3. Add these authorized redirect URIs to the existing OAuth client in Google Cloud Console:
   - Local: `http://localhost:8080/api/auth/callback/google`
   - Production: `https://beyond-reviews-193634881435.europe-west1.run.app/api/auth/callback/google`
   - For another backend origin: `<BETTER_AUTH_URL>/api/auth/callback/google`
4. From `server/`, preview and then apply the additive backfill:

   ```bash
   npm run auth:migrate -- --dry-run
   npm run auth:migrate -- --apply
   ```

5. Build and deploy the updated backend and frontend together. The backend entry point is now `dist/index.js`; `npm start` already uses it.
6. Check credential login, Google login, registration with a photo, and logout in a real browser, including production's separate frontend/backend origins.

If the deployment installs only production dependencies, run the compiled backfill after `npm run build`: `node dist/scripts/migrate-auth.js --dry-run`, followed by `node dist/scripts/migrate-auth.js --apply`.

The backfill copies existing bcrypt hashes into credential accounts without changing passwords, adds missing auth metadata and indexes, and normalizes emails to lowercase. It stops on case-insensitive email collisions without merging users. It is safe to rerun and never replaces users, deletes accounts, or modifies reviews, ratings, friendships, wishlists, or recommendation data. The original password fields remain for rollback; new credentials are stored only in `AuthAccount`. Run the backfill again after legacy development scripts that create users directly through Prisma.

Google identities were not stored by Passport. They are linked to the existing user on the next successful Google login with the same verified email. Existing profile names/photos are retained. Users must sign in again after cutover; legacy Passport sessions are not converted or deleted.

For rollback, keep a database backup and the previous application revision. The additive backfill leaves existing IDs and password hashes intact. Users created after cutover have credentials only in `AuthAccount` and cannot use legacy password login without a separate reverse migration.

Authentication integration tests run against a disposable MongoDB replica set and never use the configured application database:

```bash
cd server
npm run test:auth
```

The first test run downloads a MongoDB binary. OAuth tests simulate Google's provider response; a real Google/browser check is still needed after configuring the OAuth client.

Google Cloud Storage notes:

- Create a bucket and set `GCS_BUCKET_NAME` to that bucket name.
- Grant your service account `Storage Object Admin` (or a least-privilege equivalent with object create/read permissions).
- For local development, point `GOOGLE_APPLICATION_CREDENTIALS` to your service account JSON key file.
- If your bucket is private, use a signed URL flow instead of public object URLs.

### 3. Set Up the Client

Open a new terminal, navigate to the client directory and install dependencies:

```bash
cd client
npm install
```

### 4. Run the Application

You need to run both the server and client simultaneously.

#### Terminal 1 - Start the Server:

```bash
cd server
npm run dev
```

The server will start on `http://localhost:8080`

#### Terminal 2 - Start the Client:

```bash
cd client
npm run dev
```

The server will start on `http://localhost:5173`

### 5. Access the Application

Open your browser and navigate to `http://localhost:5173` to use the application.

## Linting and Formatting

Biome handles linting and formatting in both projects. Run each project's command from the repository root:

```bash
npm --prefix client run lint
npm --prefix server run lint
npm --prefix client run format
npm --prefix server run format
```

Alternatively, run `npm run format` inside `client/` or `server/`. Each command formats that project's JavaScript and TypeScript files, including tests and configuration scripts, using four-space indentation. Git-ignored files, build output, dependencies, and generated Prisma files are excluded.

Run `npm run lint` inside either project to check Biome's recommended rules without changing files. The client also explicitly enables React Hooks and component export checks for Fast Refresh. Linting and TypeScript compilation are separate checks; use `npm run build` for compiler validation.

In `server/`, run `npm run typecheck` to check application code, development scripts, and tests together without emitting JavaScript. The server build checks only production application code under `src/`.
