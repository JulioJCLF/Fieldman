# Analytics Module (Gestão + Gráficos) — Estrutura Criada

> Documento gerado em 2026-08-08. Descreve o módulo `analytics`, que consolida faturamento, gera comparativos e projeta crescimento por regressão linear.

---

## Visão Geral

O módulo Analytics **não tem tabelas próprias** — ele agrega sob demanda a partir das tabelas das outras áreas (`tabs`, `consumables_refills`, `inventory_sales`, `games`). Isso garante números sempre corretos sem manter uma tabela consolidada denormalizada.

**Decisão:** agregação on-demand ao invés de popular `consolidated_daily_revenue`. Para volumes maiores, essa tabela pode ser adicionada depois como cache (ver "Otimização futura").

**Projeção:** regressão linear simples no backend (sem dependência externa), conforme escolhido. Regra de negócio: só projeta com ≥ 3 meses de dados reais.

---

## Modelo de Receita (sem sobreposição)

O faturamento total é a soma de 5 fontes distintas, cada linha contada uma única vez:

| Fonte | Origem | Filtro |
|---|---|---|
| `entry_equipped` | `tabs.entry_fee` (modality EQUIPPED) | `entry_status = PAID` |
| `entry_rental` | `tabs.entry_fee` (modality RENTAL) | `entry_status = PAID` |
| `refills` | `consumables_refills.total_price` (item_type REFILL) | `payment_status = PAID` |
| `snackbar` | `inventory_sales` (SNACKBAR) + `consumables_refills` (SNACKBAR) | vendas + refills pagos |
| `store` | `inventory_sales` (STORE) + `consumables_refills` (STORE) | vendas + refills pagos |

**Atribuição temporal:** por timestamp do registro (`tabs.created_at`, `consumables_refills.created_at`, `inventory_sales.sold_at`). Jogos são atribuídos por `games.game_date`.

---

## Backend

### `backend/src/modules/analytics/`

```
analytics.types.ts       ← Tipos de relatório e interface do repositório
analytics.schemas.ts     ← Parsing de faixa de datas, ano, anos, mês
analytics.repository.ts  ← Fetch normalizado das 4 fontes
analytics.service.ts     ← Agregação, comparativos e regressão linear
analytics.controller.ts  ← Handlers Express
analytics.routes.ts      ← Router de relatórios
```

---

### `analytics.types.ts`

| Tipo | Descrição |
|---|---|
| `EntryRow`, `RefillRow`, `SaleRow`, `GameRow` | Linhas normalizadas por fonte (com flag `paid` onde aplicável) |
| `RevenueBreakdown` | 5 fontes + total |
| `CountsBreakdown` | equipados, aluguéis, recargas, jogos |
| `OverviewReport` | `{ range, revenue, counts }` |
| `MonthlyReport` | 12 buckets de um ano + total |
| `MonthComparison` | mês atual vs mesmo mês do ano anterior + `delta_pct` |
| `YearTotal` | total por ano (comparativo multi-anos) |
| `ProjectionReport` | `{ target_year, sufficient_data, based_on_months, months[] }` |
| `AnalyticsRepository` | Interface: `getEntries`, `getRefills`, `getSales`, `getGames` |

---

### `analytics.schemas.ts`

| Função | Default |
|---|---|
| `parseDateRange(query)` | Início do mês corrente → agora |
| `parseYear(input, fallback)` | Ano atual |
| `parseYears(input)` | Últimos 3 anos (`?years=2024,2025,2026`) |
| `parseMonth(input, fallback)` | Mês atual |

---

### `analytics.repository.ts`
`SupabaseAnalyticsRepository`. Cada método faz UMA query filtrada por faixa e devolve linhas normalizadas:

| Método | Tabela | Atribuição |
|---|---|---|
| `getEntries(range)` | `tabs` | `created_at` |
| `getRefills(range)` | `consumables_refills` | `created_at` |
| `getSales(range)` | `inventory_sales` | `sold_at` |
| `getGames(range)` | `games` | `game_date` |

---

### `analytics.service.ts`
`AnalyticsService`. Lógica principal:

| Método | Descrição |
|---|---|
| `getOverview(range)` | Agrega as 5 fontes de receita + 4 contadores |
| `getMonthly(year)` | 12 buckets mensais de faturamento total |
| `compareMonthAcrossYears(month, year)` | Compara com o mesmo mês do ano anterior; calcula `delta_pct` (null se base zero) |
| `compareYears(years[])` | Total de faturamento por ano |
| `getProjection(targetYear)` | Regressão linear sobre a série mensal histórica; projeta 12 meses |

**Helpers privados:**
- `monthlyRevenue(range)` — agrupa todas as fontes por chave `YYYY-MM`
- `linearRegression(points)` — mínimos quadrados, retorna `{ a, b }` de `y = a + b·x`

**Regra de projeção:**
1. Coleta histórico dos 3 anos anteriores até dez/(targetYear − 1)
2. Se < 3 meses com dados reais → `sufficient_data: false`, sem projeção
3. Monta série contínua (lacunas = 0) do 1º mês com dados até o fim; ajusta regressão; projeta os 12 meses do ano-alvo (valores negativos são zerados)

---

### `analytics.routes.ts`
Montado em `app.use('/api/analytics', ...)`.

| Método | Rota | Ação |
|---|---|---|
| GET | `/overview?from=&to=` | Consolidado do período (dia/mês/ano via faixa) |
| GET | `/monthly?year=` | Série mensal de um ano |
| GET | `/compare-months?year=&month=` | Mês atual vs mesmo mês ano anterior |
| GET | `/compare-years?years=` | Totais de múltiplos anos |
| GET | `/projection?year=` | Projeção mês a mês (regressão) |

---

### Arquivos atualizados
- **`app.ts`** — `analyticsService` em `AppDependencies` + `app.use('/api/analytics', ...)`
- **`server.ts`** — instancia `SupabaseAnalyticsRepository` + `AnalyticsService`
- **`player.routes.test.ts`** — mock de `analyticsService`

---

## Frontend

### `frontend/src/features/analytics/`

```
types.ts                       ← Tipos espelhados do backend
format.ts                      ← formatCurrency, formatCompact, MONTH_LABELS
api/
  analyticsApi.ts              ← Fetch dos 5 endpoints
components/
  AnalyticsPanel.tsx           ← Orquestra a página de Gestão
  OverviewCards.tsx            ← Cartões de faturamento + contadores (dia/mês/ano)
  MonthlyChart.tsx             ← Gráfico mensal + comparação mês atual vs ano anterior
  YearComparison.tsx           ← Comparativo entre anos
  ProjectionChart.tsx          ← Projeção do próximo ano (ou aviso de dados insuficientes)
  BarChart.tsx                 ← Gráfico de barras SVG reutilizável (sem libs externas)
```

**Nota:** os gráficos são SVG/CSS puros — nenhuma biblioteca de gráficos foi adicionada às dependências.

---

### Componentes

| Componente | Requisito do Excel atendido |
|---|---|
| `OverviewCards` | *"Valor por jogo (Dia, mês, ano)"*, *"Quantidade de equipados/aluguéis/recargas"* |
| `MonthlyChart` | *"Faturamento por mês"*, *"Comparação de mês atual com mesmo mês do ano anterior"* |
| `YearComparison` | *"Comparação do ano atual com ano anterior"*, *"Comparação de vários anos"* |
| `ProjectionChart` | *"Projeção de crescimento para o ano seguinte mês a mês"* |

---

### `frontend/src/App.tsx` (atualizado)
- Aba **Gestão** adicionada à navegação do header
- View `analytics` renderiza `<AnalyticsPanel />`

---

## Cobertura do Excel

| Requisito (Excel) | Implementado |
|---|---|
| Valor/faturamento por dia/mês/ano | ✅ `OverviewCards` (faixa) + `MonthlyChart` |
| Quantidade de equipados/aluguéis/recargas | ✅ `OverviewCards` |
| Quantidade de jogos | ✅ `OverviewCards` |
| Comparação mês atual vs mesmo mês ano anterior | ✅ `MonthlyChart` (delta %) |
| Comparação ano atual vs anterior | ✅ `YearComparison` |
| Comparação de vários anos | ✅ `YearComparison` |
| Projeção de crescimento mês a mês | ✅ `ProjectionChart` (regressão linear, ≥3 meses) |
| Custo com recarga e locação | ⚠️ Parcial — não há campo de custo em tabs/refills; custo é modelado só no inventário (`cost_price`) |

---

## Verificação
- `tsc --noEmit` limpo em backend e frontend
- 6 testes de backend passando

---

## Otimização futura

A tabela `consolidated_daily_revenue` (já no schema) pode ser adicionada como cache de leitura, populada no `FINISH` de cada jogo, caso o volume de dados torne a agregação on-demand lenta. Hoje a agregação é feita direto das fontes.

**Limite atual:** as queries usam o default de 1000 linhas do Supabase por chamada. Para faixas muito grandes, adicionar paginação nas queries do repositório.
