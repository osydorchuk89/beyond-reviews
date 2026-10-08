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

- React 19 with TypeScript 7
- React Router v7
- Tailwind CSS for styling

**Backend:**

- Node.js with Express
- TypeScript 7
- Prisma ORM with MongoDB
- Better Auth for authentication (native MongoDB adapter)

## Local Installation

Prerequisites: Node.js, npm, Git, and MongoDB Atlas or a local MongoDB replica set (transactions are required).

### 1. Clone and Install

Clone the repository and install both projects:

```bash
git clone https://github.com/osydorchuk89/beyond-reviews.git
cd beyond-reviews
npm --prefix server install
npm --prefix client install
```

The server installation generates the Prisma client automatically.

### 2. Configure the Server

Create `server/.env`:

```dotenv
DATABASE_URL=<mongodb-connection-string>
BETTER_AUTH_SECRET=<random-secret-of-at-least-32-characters>
BETTER_AUTH_URL=http://localhost:8080
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>
```

Generate a value for `BETTER_AUTH_SECRET` and paste it into the file:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Google credentials are required by the backend configuration. In your Google OAuth client, add `http://localhost:8080/api/auth/callback/google` as an authorized redirect URI.

For profile photo uploads, also set `GCS_BUCKET_NAME` and `GOOGLE_APPLICATION_CREDENTIALS` (the path to your Google Cloud service account JSON file). Set `GCS_PUBLIC_BASE_URL` only if using a custom public storage URL.

### 3. Run the App

From the repository root, start the server in one terminal:

```bash
npm --prefix server run dev
```

Start the client in another terminal:

```bash
npm --prefix client run dev
```

Open [http://localhost:5173](http://localhost:5173). The backend runs at `http://localhost:8080`.

## Existing Installations

For upgrading an existing Passport-based database, see [Authentication Migration and Deployment](docs/auth-migration.md).

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

Both projects use TypeScript 7. Run `npm --prefix client run typecheck` to check frontend code, its tests, and the Vite/Vitest configuration without bundling. The client build also performs this type check before the Vite production build. Run `npm --prefix server run typecheck` for the full server check.
