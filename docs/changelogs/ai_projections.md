# Changelog: AI Projections Module

## [2026-08-08]
- **IMPL:** Módulo `analytics` (Gestão + Gráficos) implementado.
- **Abordagem:** Projeção por **regressão linear simples no backend** (escolha do usuário), sem dependência externa. Regra de negócio respeitada: projeção só com ≥ 3 meses de dados reais (`sufficient_data`).
- **Agregação:** On-demand a partir de `tabs`, `consumables_refills`, `inventory_sales`, `games` — sem tabela consolidada denormalizada. Modelo de receita de 5 fontes sem sobreposição.
- **Backend:** `analytics.types`, `analytics.schemas`, `analytics.repository`, `analytics.service` (agregação + comparativos + `linearRegression`), `analytics.controller`, `analytics.routes`. 5 endpoints em `/api/analytics`. Registrado em `app.ts`/`server.ts`.
- **Frontend:** `types.ts`, `format.ts`, `api/analyticsApi.ts`, componentes `AnalyticsPanel`, `OverviewCards`, `MonthlyChart`, `YearComparison`, `ProjectionChart`, `BarChart` (SVG puro, sem libs). Aba "Gestão" no `App.tsx`.
- **Cobertura Excel:** faturamento dia/mês/ano, contadores, comparação mês vs mês do ano anterior, ano vs ano, multi-anos, projeção mês a mês. Custo com recarga/locação fica parcial (sem campo de custo em tabs/refills).
- **Verificação:** `tsc --noEmit` limpo em backend e frontend; 6 testes de backend passando.
- **Docs:** `docs/analytics_module_structure.md` criado.
- **Status:** Completo.

## [2026-08-03]
- **INIT:** Module specification defined (Consolidated daily revenue, seasonality matching, 3-month threshold rule).
- **Status:** Awaiting initial implementation code.
