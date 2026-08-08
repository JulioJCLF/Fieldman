# Changelog: Games Module

## [2026-08-08]
- **IMPL:** Módulo Games implementado por completo.
- **Banco:** Migration `20260808000000_create_games.sql` — tabela `games`, enums `game_type` / `game_status`, unique index parcial garantindo 1 jogo ativo por vez.
- **Backend:** `game.types`, `game.schemas` (Zod), `game.repository` (Supabase), `game.service` (regras de negócio), `game.controller`, `game.routes`. Registrado em `app.ts` e `server.ts`.
- **Frontend:** `types.ts`, `api/gamesApi.ts`, componentes `GamePanel`, `GameStatusBanner`, `CreateGameForm`, `GameSummaryCard`. Integrado em `App.tsx`.
- **Docs:** `docs/games_module_structure.md` criado com mapa completo da estrutura.
- **Status:** Completo. Próximo: Módulo Tabs/Check-in.

## [2026-08-03]
- **INIT:** Module specification defined (Open games vs Private games, group incentives).
- **Status:** Awaiting initial implementation code.