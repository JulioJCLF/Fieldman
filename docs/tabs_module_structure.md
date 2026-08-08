# Tabs Module — Estrutura Criada

> Documento gerado em 2026-08-08. Descreve todos os arquivos criados para o módulo de Comandas (Tabs / Check-in) e a responsabilidade de cada um.

---

## Visão Geral

O módulo Tabs gerencia o check-in de jogadores em um jogo ativo, o lançamento de recargas e consumíveis, e o fechamento de comandas (checkout) com registro de pagamento.

**Dependência:** o módulo Tabs depende do módulo Games — só é possível fazer check-in em jogos com status `IN_PROGRESS`.

---

## Banco de Dados

### `supabase/migrations/20260808000001_create_tabs.sql`
Cria três tabelas e seis enums.

#### Enums criados

| Enum | Valores |
|---|---|
| `tab_modality` | `EQUIPPED`, `RENTAL` |
| `entry_status` | `PENDING`, `PAID` |
| `item_type` | `REFILL`, `SNACKBAR`, `STORE` |
| `payment_status` | `PAID`, `OPEN` |
| `payment_method` | `PIX`, `CARD`, `CASH` |
| `payment_gw_status` | `PENDING`, `APPROVED`, `REJECTED`, `REFUNDED` |

#### Tabela `tabs` (comandas)

| Coluna | Tipo | Detalhe |
|---|---|---|
| `id` | UUID PK | Auto-gerado |
| `game_id` | UUID FK → `games` | Jogo ao qual a comanda pertence |
| `player_id` | UUID FK → `players`, nullable | Nulo para jogadores avulsos |
| `guest_name` | varchar(120), nullable | Nome do avulso (obrigatório se `player_id` nulo) |
| `player_name` | varchar(120) | Nome para exibição (denormalizado — evita join na listagem) |
| `modality` | `tab_modality` | Equipado ou Aluguel |
| `entry_fee` | numeric(10,2) | Taxa de entrada paga pelo jogador |
| `entry_status` | `entry_status` | Default `PENDING` |
| `created_at` / `updated_at` | timestamptz | Trigger automático |

**Constraint:** `tab_player_or_guest` — garante que ou `player_id` ou `guest_name` está preenchido.

#### Tabela `consumables_refills` (recargas e consumíveis)

| Coluna | Tipo | Detalhe |
|---|---|---|
| `tab_id` | UUID FK → `tabs` | Comanda à qual pertence |
| `item_type` | `item_type` | REFILL / SNACKBAR / STORE |
| `description` | varchar(200) | Descrição do item |
| `quantity` | int | Mínimo 1 |
| `total_price` | numeric(10,2) | Preço total do item |
| `payment_status` | `payment_status` | Default `OPEN` — fica em aberto para cobrar no final |

#### Tabela `gateway_payments` (pagamentos)

| Coluna | Tipo | Detalhe |
|---|---|---|
| `tab_id` | UUID FK → `tabs` | Comanda paga |
| `gateway_transaction_id` | varchar(200), nullable | ID externo do gateway (futuro) |
| `method` | `payment_method` | PIX / CARD / CASH |
| `amount` | numeric(10,2) | Valor pago |
| `status` | `payment_gw_status` | Default `APPROVED` (pagamento manual) |

---

## Backend

### `backend/src/modules/tabs/`

```
tab.types.ts       ← Interfaces, enums e tipos do módulo
tab.schemas.ts     ← Validação Zod de todos os inputs HTTP
tab.repository.ts  ← Acesso ao Supabase (implementa TabsRepository)
tab.service.ts     ← Regras de negócio (implementa TabServicePort)
tab.controller.ts  ← Handlers Express
tab.routes.ts      ← Dois routers: para /api/games e para /api/tabs
```

---

### `tab.types.ts`

| Exportação | Descrição |
|---|---|
| `TAB_MODALITIES`, `ENTRY_STATUSES`, `ITEM_TYPES`, `PAYMENT_STATUSES`, `PAYMENT_METHODS`, `PAYMENT_GW_STATUSES` | Arrays literais para enums |
| `TabModality`, `EntryStatus`, `ItemType`, `PaymentStatus`, `PaymentMethod`, `PaymentGwStatus` | Types derivados |
| `Tab` | Shape básico da comanda |
| `Refill` | Shape da recarga |
| `GatewayPayment` | Shape do pagamento |
| `TabWithRefills` | Tab com arrays `refills[]` e `payments[]` embedded |
| `GameTabsSummary` | Contadores + faturamento agregado de um jogo |
| `CreateTabInput`, `CreateRefillInput` | Payloads de criação |
| `TabsRepository` | Interface do repositório |

---

### `tab.schemas.ts`
Validação Zod. Expõe:

| Função | Input | Saída |
|---|---|---|
| `parseCreateTab(body, gameId)` | `request.body` + `request.params.gameId` | `CreateTabInput` |
| `parseCreateRefill(body, tabId)` | `request.body` + `request.params.tabId` | `CreateRefillInput` |
| `parseCheckoutMethod(body)` | `request.body` | `PaymentMethod` |
| `parseTabId(input)` | `request.params.tabId` | `string` (UUID) |
| `parseRefillId(input)` | `request.params.refillId` | `string` (UUID) |
| `parseGameId(input)` | `request.params.gameId` | `string` (UUID) |

**Regra:** ou `player_id` ou `guest_name` deve estar presente em `createTabSchema`.

---

### `tab.repository.ts`
`SupabaseTabsRepository` implementa `TabsRepository`.

| Método | Descrição |
|---|---|
| `createTab(input)` | Insert em `tabs`, retorna `TabWithRefills` com arrays vazios |
| `findTabById(id)` | Select com join em `consumables_refills` e `gateway_payments` |
| `listTabsByGame(gameId)` | Busca todas as tabs do jogo com refills e pagamentos embedded |
| `getGameSummary(gameId)` | Agrega contagens e faturamento em JS (2 queries Supabase) |
| `addRefill(input)` | Insert em `consumables_refills` |
| `findRefillById(tabId, refillId)` | Busca refill com validação de pertencimento à comanda |
| `markRefillPaid(refillId)` | Update `payment_status = 'PAID'` |
| `checkout(tabId, method, amount, openRefillIds)` | 3 operações sequenciais: insert payment → update refills → update tab |

**Nota sobre checkout:** não é transacional (Supabase JS não suporta transações multi-step diretamente). Em produção, extrair para uma função RPC PostgreSQL.

---

### `tab.service.ts`
`TabService` implementa `TabServicePort`. Recebe `TabsRepository` + `GamesRepository` no construtor.

| Método | Regra de negócio |
|---|---|
| `checkin(input)` | Verifica jogo `IN_PROGRESS` antes de criar a comanda |
| `listTabs(gameId)` | Delegação direta ao repository |
| `getGameSummary(gameId)` | Delegação direta ao repository |
| `getTab(tabId)` | `requireTab` — lança 404 se não encontrado |
| `addRefill(tabId, input)` | Verifica que a comanda existe antes de adicionar |
| `markRefillPaid(tabId, refillId)` | Verifica que o refill pertence à comanda e não está pago |
| `checkout(tabId, method)` | Calcula total = entryOwed + refillsOwed; lança 422 se total ≤ 0 |

---

### `tab.controller.ts`
`TabController` — um método por endpoint, todos com `try/catch → next(error)`.

| Método | HTTP | Rota |
|---|---|---|
| `checkin` | POST | `/api/games/:gameId/tabs` |
| `listTabs` | GET | `/api/games/:gameId/tabs` |
| `getGameSummary` | GET | `/api/games/:gameId/tabs/summary` |
| `getTab` | GET | `/api/tabs/:tabId` |
| `addRefill` | POST | `/api/tabs/:tabId/refills` |
| `markRefillPaid` | PATCH | `/api/tabs/:tabId/refills/:refillId/pay` |
| `checkout` | POST | `/api/tabs/:tabId/checkout` |

---

### `tab.routes.ts`
Exporta **duas** factories:

| Factory | Montagem em `app.ts` | Rotas |
|---|---|---|
| `createTabsForGameRouter(tabService)` | `app.use('/api/games', ...)` | `POST/:gameId/tabs`, `GET/:gameId/tabs/summary`, `GET/:gameId/tabs` |
| `createTabsRouter(tabService)` | `app.use('/api/tabs', ...)` | `GET/:tabId`, `POST/:tabId/refills`, `PATCH/:tabId/refills/:refillId/pay`, `POST/:tabId/checkout` |

**Nota de ordem:** `/summary` declarado antes de `/:tabId` para não ser capturado como parâmetro.

---

### Arquivos atualizados

**`backend/src/app.ts`**
- Adicionado `tabService: TabServicePort` em `AppDependencies`
- Registrados `createTabsForGameRouter` e `createTabsRouter`

**`backend/src/server.ts`**
- `gamesRepository` extraído como variável compartilhada (usada por `GameService` e `TabService`)
- Instanciados `SupabaseTabsRepository` + `TabService`

**`backend/src/modules/players/player.routes.test.ts`**
- `createTestApp` atualizado com mocks de `gameService` e `tabService` para refletir novo `AppDependencies`

---

## Frontend

### `frontend/src/features/tabs/`

```
types.ts                         ← Tipos espelhados do backend
api/
  tabsApi.ts                     ← Funções fetch para todos os endpoints
components/
  CheckInSection.tsx             ← Orquestra estado e renderiza check-in + lista
  CheckInForm.tsx                ← Formulário de check-in (cadastrado ou avulso)
  TabList.tsx                    ← Lista de TabCards ou estado vazio
  TabCard.tsx                    ← Card expandível: info + recargas + ações
  RefillModal.tsx                ← Modal para lançar recarga / item
  CheckoutModal.tsx              ← Modal para fechar comanda com resumo e pagamento
```

---

### `types.ts`
Espelha os tipos do backend. Inclui todos os enums, `Tab`, `Refill`, `GatewayPayment`, `TabWithRefills`, `GameTabsSummary` e payloads de criação.

---

### `api/tabsApi.ts`
Funções assíncronas para cada endpoint:

| Função | Endpoint |
|---|---|
| `createTab(gameId, payload)` | POST `/api/games/:gameId/tabs` |
| `listTabs(gameId)` | GET `/api/games/:gameId/tabs` |
| `getGameSummary(gameId)` | GET `/api/games/:gameId/tabs/summary` |
| `addRefill(tabId, payload)` | POST `/api/tabs/:tabId/refills` |
| `markRefillPaid(tabId, refillId)` | PATCH `/api/tabs/:tabId/refills/:refillId/pay` |
| `checkout(tabId, payload)` | POST `/api/tabs/:tabId/checkout` |

---

### `CheckInSection.tsx`
Componente raiz da seção de check-in. Responsável por:
1. Buscar todas as tabs do jogo ao montar
2. Mostrar botão "+ Novo check-in" + `CheckInForm` quando acionado
3. Exibir contadores inline (total, equipados, aluguéis)
4. Renderizar `TabList` com estado local atualizado após cada ação

---

### `CheckInForm.tsx`
Formulário de check-in com duas abas:
- **Cadastrado:** campo de busca por nº, CPF ou telefone → chama `searchPlayerExact` → exibe resultado para confirmação
- **Avulso:** campo de nome livre

Ambas compartilham seleção de modalidade (EQUIPPED / RENTAL) e campo de taxa de entrada. Submete via `createTab`.

---

### `TabCard.tsx`
Card colapsável por comanda:
- Cabeçalho: badge de modalidade, nome do jogador, total pendente ou "Pago"
- Expandido: taxa de entrada com status, lista de recargas com botão "Pagar" por item
- Ações: "+ Recarga" (abre `RefillModal`) e "Fechar comanda" (abre `CheckoutModal`, visível só se houver pendência)
- Atualiza estado local sem re-fetch ao marcar recarga paga

---

### `RefillModal.tsx`
Modal para lançar recarga ou item:
- Tipo: REFILL / SNACKBAR / STORE
- Descrição, quantidade, preço total
- **Pagamento:** "Pagar agora" (status `PAID`) ou "Deixar em aberto" (status `OPEN`) — funcionalidade-chave do Excel

---

### `CheckoutModal.tsx`
Modal de fechamento de comanda:
- Resume pendências: taxa de entrada (se PENDING) + recargas OPEN
- Total destacado
- Seleção de método: PIX / Cartão / Dinheiro
- Chama `checkout(tabId, { method })`

---

### Componentes atualizados

**`GameSummaryCard.tsx`** (módulo Games)
- Adicionado `useEffect` que chama `getGameSummary(game.id)` ao montar
- Contadores agora exibem valores reais (equipped_count, rental_count, total_revenue) ao invés de "—"

**`GamePanel.tsx`** (módulo Games)
- Adicionado `<CheckInSection gameId={activeGame.id} />` abaixo do `GameSummaryCard` quando há jogo ativo

---

## Endpoints Resumidos

| Método | Rota | Status | Possíveis erros |
|---|---|---|---|
| POST | `/api/games/:gameId/tabs` | 201 | 404 (jogo), 422 (jogo não IN_PROGRESS) |
| GET | `/api/games/:gameId/tabs` | 200 (array) | — |
| GET | `/api/games/:gameId/tabs/summary` | 200 | — |
| GET | `/api/tabs/:tabId` | 200 | 404 |
| POST | `/api/tabs/:tabId/refills` | 201 | 404 (tab) |
| PATCH | `/api/tabs/:tabId/refills/:refillId/pay` | 200 | 404, 422 (já pago) |
| POST | `/api/tabs/:tabId/checkout` | 200 | 404, 422 (sem pendências) |

---

## Próximo passo

Com Tabs implementado, os próximos módulos são **Lanchonete** e **Loja** (`docs/implementation_guide.md` → Módulos 3 e 4).
Ambos têm a mesma estrutura entre si e reutilizarão o padrão de `item_type = SNACKBAR / STORE` já existente nas recargas.
