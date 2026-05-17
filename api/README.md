# SIMMAM API (minimal scaffold)

This folder contains a minimal Express + TypeScript scaffold that uses the Supabase Service Role key to perform server-side operations.

Prereqs:
- Node 18+
- A Supabase project with the schema from `../supabase/schema.sql` applied

Running locally:

1. Copy `.env.example` to `.env` and fill in keys.
2. Install deps: `npm install` (run inside `api` folder)
3. Start dev server: `npm run dev`

Endpoints (examples):
- `GET /api/health` — health check
- `GET /api/events` — list events
- `POST /api/registrations` — create registration. Body: `{ email, name, register_number, house, event_id }`
- `GET /api/users/:email/registrations` — list a user's registrations

Notes:
- This is a minimal starting point. You should add proper validation, authentication for admin endpoints, rate-limiting, and logging before production.
