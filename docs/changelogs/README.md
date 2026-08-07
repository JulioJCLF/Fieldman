# TASK PROMPT: IMPLEMENTATION OF THE PLAYER REGISTRATION AND MANAGEMENT MODULE

Based on our System Prompt and living documentation (`docs/business_rules.md` and `docs/database_schema.md`), let's start practical development by creating the **Player Management Module (Players / Registration)**.

Please execute the following technical tasks:

1. **PRELIMINARY CONSULTATION:** Read the `players` (`jogadores`) schema in the database documentation and the rules for rapid registration and quick identification via `registration_number`.
2. **BACKEND (Node.js + TypeScript):**
   - Create the migration/schema for the `players` table compatible with Supabase.
   - Create the `POST /api/players` route to register a new player (with Zod validation requiring name, unique CPF, phone, email, and date of birth, automatically generating the sequential `registration_number`).
   - Create the `GET /api/players/search` route allowing quick searches for players by `registration_number`, `cpf`, or `phone` (essential for fast front-desk check-in).
3. **FRONTEND (React + Tailwind):**
   - Create a clean and responsive form component for rapid new player registration.
   - Create an optimized search bar to instantly locate the player at the front desk by their registration number.
4. **CHANGELOG UPDATE:**
   - Upon completion, log the delivery of this feature in the `/docs/changelog_ai.md` file.

Write modular, strongly typed, production-ready code.