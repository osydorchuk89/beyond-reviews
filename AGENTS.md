# Beyond Reviews Agent Context

This file is the durable onboarding brief for AI agents and new contributors. Read it before making code changes, then inspect the relevant files in `client/` and `server/` before editing.

## Product Direction

Beyond Reviews is a full-stack social review and recommendation application. The current product and database are movie-focused: users can browse movies, rate and review them, manage watchlists, connect with other users, message friends, view activity, and receive recommendations.

The longer-term product direction is broader than movies. The app should be able to support reviews and recommendations for books and music albums in the future. When adding new features, avoid unnecessary assumptions that the only reviewable media type will always be a movie. Prefer names and abstractions that can grow toward multiple media types when that does not make the current implementation more complex.

Recommendations are a core business goal. Future recommendation work should account for user preferences across movies first, then eventually books and albums as those domains are added. Social signals, ratings, reviews, watchlists or saved items, and explicit preferences may all become useful recommendation inputs.

## Architecture

The repository has two applications:

- `client/`: React + TypeScript frontend built with Vite, React Router, Tailwind CSS, Zustand, React Hook Form, Zod, and Axios.
- `server/`: Node.js + Express + TypeScript backend using Prisma with MongoDB.

Important server concerns:

- Auth/session behavior uses Passport, Google OAuth, Express sessions, and Mongo-backed session storage.
- Prisma schema and generated client live under `server/prisma/`.
- Upload/storage behavior uses Google Cloud Storage.
- API code is organized under `server/src/controllers`, `server/src/routes`, `server/src/services`, `server/src/config`, and `server/src/lib`.

Important client concerns:

- App entry points live in `client/src/main.tsx`, `client/src/App.tsx`, and `client/src/routes.ts`.
- Shared UI and feature components live under `client/src/components`.
- Client state and shared logic live under `client/src/store`, `client/src/hooks`, and `client/src/lib`.
- Styling uses Tailwind CSS and local styles in `client/src/styles` and `client/src/index.css`.

## Core Domains

- Users and profiles
- Authentication and sessions
- Movies, currently the only reviewable content type
- Ratings and reviews
- Watchlists or saved media
- Friend/social graph
- Messaging
- Activity feeds
- Movie recommendations now, cross-media recommendations later

## Local Development

Run the backend:

```bash
cd server
npm run dev
```

The server runs on `http://localhost:8080`.

Run the frontend:

```bash
cd client
npm run dev
```

The client runs on `http://localhost:5173`.

## Validation Commands

Use the smallest validation that fits the change.

Client:

```bash
cd client
npm run build
npm run lint
npm run test
```

Server:

```bash
cd server
npm run build
```

The server currently has no real automated test script; `npm test` is a placeholder.

## Working Guidelines

- Prefer existing project patterns over introducing new architecture.
- Keep changes scoped to the requested behavior.
- Be careful with auth, sessions, Prisma schema changes, and data migrations.
- Do not change the Prisma schema casually. If a schema change is needed, explain the data impact.
- Do not hard-code movie-only language in reusable business logic unless the code is intentionally movie-specific.
- When building recommendation features, keep the design open to future books and music albums.
- Keep frontend UI consistent with the current Tailwind component style.
- Do not commit secrets, `.env` values, service account files, generated build output, or `node_modules`.

## How To Approach Tasks

1. Read this file and the README.
2. Inspect the relevant `client/` and/or `server/` files.
3. Make the smallest coherent change.
4. Run focused validation when practical.
5. Report what changed, what was validated, and any remaining risk.
