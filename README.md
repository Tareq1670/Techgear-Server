# Techgear-Server

Backend REST API for the **TechGear** e-commerce platform (tech accessories). Built with Express 5, TypeScript, Prisma ORM, and PostgreSQL (Supabase-ready).

## Tech Stack

- **Express 5** — HTTP framework
- **TypeScript** — strict mode, CommonJS, ES2022
- **Prisma ORM + PostgreSQL** — schema, migrations, generated client
- **jose-cjs** — verifies JWTs issued by Better-Auth on the Next.js client against its remote JWKS endpoint (`{CLIENT_URL}/api/auth/jwks`)
- **zod** — request validation
- Dev: `ts-node-dev`; Build: `tsc` → `dist`

## Auth Model

This backend **never signs or issues tokens**. Authentication is owned by the Next.js client (Better-Auth). The server only verifies JWTs:

- `verifyToken` middleware verifies `Authorization: Bearer <token>` against the client's JWKS (`{CLIENT_URL}/api/auth/jwks`) and attaches the payload to `req.auth`.
- `authorizeAdmin` middleware requires `req.auth.role === 'ADMIN'`.
- Route order: `verifyToken, authorizeAdmin` for admin-only endpoints.

## Getting Started

Requirements: Node 22.

```bash
npm install
cp .env.example .env   # fill in real values
npx prisma migrate dev
npm run dev
```

Server runs on `http://localhost:5000` by default. Health check: `GET /health`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run with ts-node-dev (transpile-only) |
| `npm run build` | Type-check and compile to `dist/` |
| `npm start` | Run compiled `dist/server.js` |
| `npm run prisma:generate` | Regenerate Prisma client |
| `npm run prisma:migrate` | Create and apply a migration |
| `npm run prisma:studio` | Open Prisma Studio |

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port |
| `NODE_ENV` | `development` / `production` |
| `CLIENT_URL` | Next.js (Better-Auth) origin; JWKS is fetched from `{CLIENT_URL}/api/auth/jwks` |
| `DATABASE_URL` | PostgreSQL connection URL (connection pool / pgbouncer) |
| `DIRECT_URL` | Direct PostgreSQL connection URL (for migrations) |
| `IMGBB_API_KEY` | ImgBB API key for image uploads |

No `JWT_SECRET` — this backend never signs tokens.

## Project Structure

```
src/
├── app.ts                 # Express app init & middleware
├── server.ts              # Server entry point & listener
├── config/                # Env loading & global config
├── middlewares/           # auth.ts, admin.ts
└── routes/                # Central router under /api
prisma/
├── schema.prisma          # Database schema (models + enums)
└── migrations/            # SQL migrations
```

## API Conventions

- Every response uses the envelope `{ success, message, data }`.
- UUID ids, soft delete (`isDeleted`), and `createdAt`/`updatedAt` on all models; reads filter `isDeleted: false`.
- `userId` on resources comes from `req.auth.sub`, never from the request body.

## Deployment

Deployable on Render via `render.yaml` (build: install → prisma generate → migrate deploy → build; health check `/health`). In production `CLIENT_URL` must point at the deployed Next.js app so its `/api/auth/jwks` resolves.
