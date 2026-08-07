# Fieldman

Fieldman is an Airsoft Field Management System. The initial module provides secure player registration and fast front-desk search through a Node.js API and a React/Tailwind interface.

## Structure

- `backend/` — Express REST API, Zod validation, and the Supabase server-side integration.
- `frontend/` — Vite/React user interface. It talks only to the REST API.
- `supabase/migrations/` — PostgreSQL migrations to apply through the Supabase CLI or dashboard.

## Local setup

1. Copy `backend/.env.example` to `backend/.env` and set the Supabase URL and **service-role** key. Keep this key on the backend only.
2. Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL` (normally `http://localhost:3001`).
3. Install dependencies with `npm install`.
4. Apply `supabase/migrations/20260804000000_create_players.sql` to the target Supabase project.
5. Run `npm run dev`.

Run `npm run check` to type-check, test, and build both applications.
