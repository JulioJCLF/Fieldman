# Iteration History (AI Log)

*Instruction for AI: Whenever you complete a structural change, route creation, or feature implementation, record it here concisely using the current date.*

## [2026-08-08] · Qualidade, estrutura & design
- **HARNESS DE TESTES:** Harness `backend/src/test/harness.ts` (`buildTestApp` com serviços mockados). Cobertura vitest expandida de 6 → **57 testes** no backend (services + rotas de games/tabs/inventory/analytics/payments). Frontend com Testing Library + jsdom: **9 testes** (primitivos + fluxo de componente).
- **E2E:** Playwright configurado (`frontend/e2e`) com interceptação de `/api/*` — roda sem backend/Supabase. Teste de check-in passando no Chromium.
- **TOOLING:** ESLint 9 (flat config) + Prettier na raiz; `react-hooks/set-state-in-effect` desligada com justificativa. CI em `.github/workflows/ci.yml` (quality + e2e). Gate único `npm run check` (lint→typecheck→test→build) verde.
- **FRONTEND — cliente de API único:** `src/lib/apiClient.ts` elimina a duplicação de fetch nas 6 features.
- **DESIGN SYSTEM:** `src/components/ui/` (Button, Field, TextInput/Textarea/Select, SegmentedControl, Alert, Badge, Card, Modal, formatCurrency). Formulários/modais principais refatorados.
- **ROBUSTEZ:** `ErrorBoundary` envolvendo o App (sem tela branca em erro de render).
- **DOCS:** `docs/testing_and_quality.md` e `docs/frontend_design_system.md`.

## [2026-08-08]
- **IMPL Games:** Módulo Games implementado — migration, backend completo (types/schemas/repository/service/controller/routes), frontend (GamePanel, GameStatusBanner, CreateGameForm, GameSummaryCard).
- **IMPL Tabs:** Módulo Tabs implementado — migration (tabs, consumables_refills, gateway_payments), backend completo com 2 routers, frontend (CheckInSection, CheckInForm, TabList, TabCard, RefillModal, CheckoutModal).
- **IMPL Inventory (Lanchonete + Loja):** Módulo unificado `inventory` (canal SNACKBAR/STORE) — migration (inventory_products, inventory_sales), backend completo, frontend (InventoryPanel, ProductForm, ProductRow, SalePosForm, ReportsPanel) + navegação por abas no App. `tsc` limpo, 6 testes passando.
- **IMPL Analytics (Gestão + Gráficos):** Módulo `analytics` — agregação on-demand das fontes, comparativos (mês/ano/multi-anos) e projeção por regressão linear (≥3 meses). Backend completo, frontend com gráficos SVG puros (OverviewCards, MonthlyChart, YearComparison, ProjectionChart) + aba "Gestão". `tsc` limpo, 6 testes passando.
- **IMPL Payments (Mercado Pago · PIX):** Módulo `payments` — cobrança PIX com QR na tela, webhook + polling, conciliação automática da comanda. Padrão Adapter (`PaymentGatewayPort`) com gateway real do Mercado Pago e modo mock (aprova sozinho, sem credencial). Frontend: `PixPayment` + integração no `CheckoutModal`. `tsc` limpo, 6 testes passando.
- **DOCS:** `docs/implementation_guide.md` + 5 docs de estrutura (`games`, `tabs`, `inventory`, `analytics`, `payments`) criados. Todos os changelogs atualizados.
- **Status:** Players ✅ · Games ✅ · Tabs ✅ · Lanchonete ✅ · Loja ✅ · Gestão ✅ · Gráficos ✅ · Pagamentos PIX ✅ — **TODOS OS MÓDULOS DO EXCEL + GATEWAY PIX IMPLEMENTADOS**

## [2026-08-03]
- **INIT:** Initialization of Spec-Driven Development.
- **Docs:** Created architecture, business rules, and database specification files.
- **Status:** Awaiting base repository setup (Frontend and Backend).