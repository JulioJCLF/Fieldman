# Changelog: Financials & Tabs Module

## [2026-08-08]
- **IMPL:** Módulo Tabs / Check-in implementado por completo.
- **Banco:** Migration `20260808000001_create_tabs.sql` — tabelas `tabs`, `consumables_refills`, `gateway_payments` com 6 enums e constraints de integridade.
- **Backend:** `tab.types`, `tab.schemas` (Zod), `tab.repository` (Supabase com join nested), `tab.service` (regras de negócio + dependência de GamesRepository), `tab.controller`, `tab.routes` (2 routers: `/api/games/:gameId/tabs` e `/api/tabs`). Registrados em `app.ts` e `server.ts`.
- **Frontend:** `types.ts`, `api/tabsApi.ts`, componentes `CheckInSection`, `CheckInForm` (busca cadastrado + avulso), `TabList`, `TabCard` (expandível com ações inline), `RefillModal` (item_type + status OPEN/PAID), `CheckoutModal` (resumo + método de pagamento).
- **Integração Games:** `GameSummaryCard` atualizado com contadores reais via `getGameSummary`; `GamePanel` integra `CheckInSection` quando jogo está ativo.
- **Testes:** `player.routes.test.ts` atualizado com mocks de `gameService` e `tabService` para refletir novo `AppDependencies`.
- **Docs:** `docs/tabs_module_structure.md` criado com mapa completo da estrutura.
- **Status:** Completo. Próximo: Módulos Lanchonete e Loja.

## [2026-08-03]
- **INIT:** Module specification defined (Tabs, consumables/refills, payment gateways).
- **Status:** Awaiting initial implementation code.