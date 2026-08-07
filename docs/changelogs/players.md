# Changelog: Players Module

## [2026-08-04]
- **Interface:** Redesigned the full staff player/check-in experience as a dark tactical command center, aligning its navigation, forms, search panel, status states, and selected-player panel with the public registration visual system.
- **Player experience:** Added the dedicated `/register` self-registration view with a dark tactical visual system, essential-field-only intake, consent validation, clear API submission states, and a registration-number confirmation screen.
- **Database:** Added the Supabase `players` migration with UUIDs, an atomic sequential `registration_number`, unique normalized CPF, indexed phone lookup, consent/profile fields, and the required `date_of_birth` field from the registration rules.
- **Backend:** Added the typed Express API: `POST /api/players` and exact `GET /api/players/search` (`registration_number`, `cpf`, or `phone`). Zod validation normalizes identifiers, validates CPF/date/consent, and returns duplicate CPFs as HTTP 409.
- **Frontend:** Added the React/Tailwind rapid registration form and debounced, abortable front-desk search component. The browser communicates only with the REST API and never with Supabase directly.
- **Quality:** Added backend route/schema tests and frontend validation tests; type-checks, tests, and production builds pass.

## [2026-08-03]
- **INIT:** Module specification defined (rapid registration, CPF uniqueness, sequential `registration_number`).
- **Status:** Awaiting initial implementation code.
