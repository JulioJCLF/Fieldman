# Fieldman — Guia de Implementação

> Fonte de verdade para o desenvolvimento dos módulos. Cada módulo lista: o que fazer, a ordem, as regras de negócio e o checklist de entrega. Atualizar conforme o desenvolvimento avança.

---

## Status Geral

| Módulo | Backend | Frontend | Banco | Status |
|---|---|---|---|---|
| Players | ✅ | ✅ | ✅ | Completo |
| Games | ✅ | ✅ | ✅ | Completo |
| Tabs / Check-in | ✅ | ✅ | ✅ | Completo |
| Lanchonete | ✅ | ✅ | ✅ | Completo (módulo `inventory`) |
| Loja | ✅ | ✅ | ✅ | Completo (módulo `inventory`) |
| Gestão / Relatórios | ✅ | ✅ | ✅ | Completo (módulo `analytics`) |
| Gráficos + IA | ✅ | ✅ | ✅ | Completo (regressão linear) |

> **Nota:** Lanchonete e Loja foram unificados no módulo `inventory` (canal `SNACKBAR`/`STORE`). Ver `docs/inventory_module_structure.md`.
> **Nota:** Gestão e Gráficos+IA foram unificados no módulo `analytics` (agregação on-demand + regressão linear). Ver `docs/analytics_module_structure.md`.
>
> **🎉 Todos os módulos do Excel foram implementados.**

---

## Módulo 1 — Games (Jogos)

### Objetivo
Permitir abrir um jogo (aberto ou fechado), controlar seu ciclo de vida (agendado → em andamento → finalizado) e servir de âncora para todos os check-ins e comandas do dia.

### Regras de Negócio
- Um jogo tem tipo `OPEN` (aberto, rotação individual) ou `PRIVATE` (fechado, grupo).
- Só pode existir **um jogo `IN_PROGRESS` por vez** — bloquear criação de novo se já houver um ativo.
- O status segue o ciclo: `SCHEDULED → IN_PROGRESS → FINISHED`. Não pode voltar atrás.
- Jogo `PRIVATE`: incentivo — organizador que garantir 10 pagantes adiantados tem a taxa isenta. Essa lógica fica no service ao finalizar o check-in do jogo.
- Ao finalizar um jogo (`FINISHED`), o sistema deve calcular e persistir o faturamento consolidado na tabela `consolidated_daily_revenue`.

### Schema — Migration

**Arquivo:** `supabase/migrations/20260808000000_create_games.sql`

```sql
-- Enums
do $$ begin
  create type public.game_type   as enum ('OPEN', 'PRIVATE');
  create type public.game_status as enum ('SCHEDULED', 'IN_PROGRESS', 'FINISHED');
exception when duplicate_object then null; end $$;

-- Tabela games
create table if not exists public.games (
  id          uuid primary key default gen_random_uuid(),
  type        public.game_type   not null,
  game_date   date               not null default current_date,
  status      public.game_status not null default 'SCHEDULED',
  notes       text,
  created_at  timestamptz not null default timezone('utc', now()),
  updated_at  timestamptz not null default timezone('utc', now())
);

create index if not exists games_status_idx   on public.games (status);
create index if not exists games_date_idx     on public.games (game_date);

-- Garantir no banco que só 1 jogo ativo por vez
create unique index if not exists games_single_active
  on public.games (status)
  where status = 'IN_PROGRESS';

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

alter table public.games enable row level security;
```

---

### Backend

#### Tipos — `backend/src/modules/games/game.types.ts`

```typescript
export const GAME_TYPES   = ['OPEN', 'PRIVATE'] as const;
export const GAME_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'FINISHED'] as const;

export type GameType   = (typeof GAME_TYPES)[number];
export type GameStatus = (typeof GAME_STATUSES)[number];

export interface Game {
  id: string;
  type: GameType;
  game_date: string;
  status: GameStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGameInput {
  type: GameType;
  game_date?: string;   // default: today
  notes?: string;
}

export interface GamesRepository {
  create(input: CreateGameInput): Promise<Game>;
  findById(id: string): Promise<Game | null>;
  findActive(): Promise<Game | null>;
  updateStatus(id: string, status: GameStatus): Promise<Game>;
  listByDate(date: string): Promise<Game[]>;
}
```

#### Rotas esperadas

| Método | Rota | Ação |
|---|---|---|
| `POST` | `/api/games` | Criar jogo (status inicial: `SCHEDULED`) |
| `PATCH` | `/api/games/:id/start` | Iniciar jogo (`SCHEDULED → IN_PROGRESS`) |
| `PATCH` | `/api/games/:id/finish` | Finalizar jogo (`IN_PROGRESS → FINISHED`) |
| `GET` | `/api/games/active` | Retornar o jogo em andamento (se houver) |
| `GET` | `/api/games/:id` | Buscar jogo por ID |
| `GET` | `/api/games?date=YYYY-MM-DD` | Listar jogos por data |

#### Validações Zod (service)
- `type`: enum `OPEN | PRIVATE`
- `game_date`: data válida, não pode ser no passado (opcional, default hoje)
- Ao iniciar: verificar que não existe outro `IN_PROGRESS` antes de mudar status
- Ao finalizar: disparar consolidação de faturamento do dia

---

### Frontend

**Pasta:** `frontend/src/features/games/`

#### Componentes a criar

| Componente | Responsabilidade |
|---|---|
| `GameStatusBanner` | Exibe o jogo ativo no topo da tela (tipo, horário de início, status) |
| `CreateGameForm` | Formulário para abrir um novo jogo (tipo + data + notas) |
| `GameActionButtons` | Botões "Iniciar Jogo" e "Finalizar Jogo" com confirmação |
| `GameSummaryCard` | Resumo do jogo: qtd equipados, qtd aluguéis, faturamento parcial |

#### Estado de UI
- Se não houver jogo ativo → mostrar botão "Abrir Novo Jogo"
- Se houver jogo `IN_PROGRESS` → mostrar `GameStatusBanner` + `GameSummaryCard` + botão "Finalizar"
- Ao finalizar → confirmar com modal (ação irreversível)

---

### Checklist de Entrega — Games

**Banco**
- [ ] Migration `20260808000000_create_games.sql` aplicada
- [ ] Unique index garante apenas 1 jogo ativo por vez

**Backend**
- [ ] `game.types.ts` criado
- [ ] `game.repository.ts` com todos os métodos do `GamesRepository`
- [ ] `game.service.ts` com regras de negócio (bloquear 2º jogo ativo, ciclo de status)
- [ ] `game.controller.ts` com tratamento de erros HTTP
- [ ] `game.routes.ts` registrado no `app.ts`
- [ ] Testes de rota: criar, iniciar, finalizar, buscar ativo

**Frontend**
- [ ] `game.types.ts` e `gamesApi.ts` (fetch das rotas acima)
- [ ] `GameStatusBanner` exibido quando há jogo ativo
- [ ] `CreateGameForm` funcional
- [ ] `GameActionButtons` com confirmação no finalizar
- [ ] `GameSummaryCard` com contadores básicos

---

## Módulo 2 — Tabs / Check-in (Comandas)

> Implementar **depois** que o módulo Games estiver completo.

### Objetivo
Registrar a entrada de cada jogador em um jogo, definindo modalidade (equipado ou aluguel) e controlar recargas e pagamentos vinculados.

### Regras de Negócio
- Uma comanda (`tab`) é sempre vinculada a um `game_id`.
- `player_id` é **nullable** — jogadores avulsos (sem cadastro) são permitidos. Neste caso, registrar nome informal no campo `guest_name`.
- Preços de `EQUIPPED` e `RENTAL` são configurados por jogo (ou globalmente — definir com o usuário).
- Recargas (`consumables_refills`) podem ter `payment_status = 'OPEN'` para cobrar no final.
- Ao fechar a comanda, somar: `entry_fee` + todas as recargas `OPEN` → gerar `gateway_payment`.
- Jogo `PRIVATE`: ao iniciar o check-in, contar pagantes adiantados para verificar isenção do organizador.

### Schema — Migration

**Arquivo:** `supabase/migrations/20260808000001_create_tabs.sql`

```sql
-- Enums
do $$ begin
  create type public.tab_modality     as enum ('EQUIPPED', 'RENTAL');
  create type public.entry_status     as enum ('PENDING', 'PAID');
  create type public.item_type        as enum ('REFILL', 'SNACKBAR', 'STORE');
  create type public.payment_status   as enum ('PAID', 'OPEN');
  create type public.payment_method   as enum ('PIX', 'CARD', 'CASH');
  create type public.payment_gw_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED');
exception when duplicate_object then null; end $$;

-- Tabela tabs (comandas)
create table if not exists public.tabs (
  id           uuid primary key default gen_random_uuid(),
  game_id      uuid not null references public.games(id),
  player_id    uuid references public.players(id),  -- nullable: avulso
  guest_name   varchar(120),                         -- usado quando player_id é null
  modality     public.tab_modality not null,
  entry_fee    numeric(10,2) not null default 0,
  entry_status public.entry_status not null default 'PENDING',
  created_at   timestamptz not null default timezone('utc', now()),
  updated_at   timestamptz not null default timezone('utc', now()),
  constraint tab_player_or_guest check (player_id is not null or guest_name is not null)
);

create index if not exists tabs_game_idx   on public.tabs (game_id);
create index if not exists tabs_player_idx on public.tabs (player_id);

-- Recargas e consumíveis
create table if not exists public.consumables_refills (
  id             uuid primary key default gen_random_uuid(),
  tab_id         uuid not null references public.tabs(id),
  item_type      public.item_type not null,
  description    varchar(200) not null,
  quantity       int not null default 1 check (quantity > 0),
  total_price    numeric(10,2) not null,
  payment_status public.payment_status not null default 'OPEN',
  created_at     timestamptz not null default timezone('utc', now())
);

create index if not exists consumables_tab_idx on public.consumables_refills (tab_id);

-- Pagamentos
create table if not exists public.gateway_payments (
  id                     uuid primary key default gen_random_uuid(),
  tab_id                 uuid not null references public.tabs(id),
  gateway_transaction_id varchar(200),
  method                 public.payment_method not null,
  amount                 numeric(10,2) not null,
  status                 public.payment_gw_status not null default 'PENDING',
  created_at             timestamptz not null default timezone('utc', now())
);

-- Triggers updated_at
drop trigger if exists tabs_set_updated_at on public.tabs;
create trigger tabs_set_updated_at
  before update on public.tabs
  for each row execute function public.set_updated_at();

alter table public.tabs               enable row level security;
alter table public.consumables_refills enable row level security;
alter table public.gateway_payments    enable row level security;
```

### Rotas esperadas

| Método | Rota | Ação |
|---|---|---|
| `POST` | `/api/games/:gameId/tabs` | Check-in: criar comanda |
| `GET` | `/api/games/:gameId/tabs` | Listar todas as comandas do jogo |
| `POST` | `/api/tabs/:tabId/refills` | Lançar recarga na comanda |
| `PATCH` | `/api/tabs/:tabId/refills/:refillId/pay` | Marcar recarga como paga |
| `POST` | `/api/tabs/:tabId/checkout` | Fechar comanda (cobrar pendências + registrar pagamento) |
| `GET` | `/api/tabs/:tabId` | Detalhe da comanda |

### Checklist de Entrega — Tabs

**Banco**
- [ ] Migration aplicada (tabs, consumables_refills, gateway_payments)
- [ ] Constraint `tab_player_or_guest` funcionando

**Backend**
- [ ] Types, repository, service, controller, routes
- [ ] Validação: `guest_name` obrigatório quando `player_id` é null
- [ ] Service: ao checkout, somar entry_fee + refills OPEN

**Frontend**
- [ ] Tela de check-in (buscar jogador ou lançar avulso)
- [ ] Seleção de modalidade (EQUIPPED / RENTAL) com preços
- [ ] Lista de comandas do jogo ativo com status
- [ ] Modal de lançamento de recarga
- [ ] Modal de checkout (exibir total, escolher método de pagamento)

---

## Módulo 3 — Lanchonete

> Implementar depois de Tabs.

### Objetivo
Cadastro de produtos, controle de estoque, lançamento de vendas e faturamento da lanchonete independente dos jogos.

### Tabelas Necessárias (novas)
- `snackbar_products`: id, name, category, cost_price, sale_price, stock_qty
- `snackbar_sales`: id, product_id, tab_id (nullable — pode ser venda avulsa), quantity, unit_price, sold_at

### Rotas esperadas

| Método | Rota | Ação |
|---|---|---|
| `POST` | `/api/snackbar/products` | Cadastrar produto |
| `GET` | `/api/snackbar/products` | Listar produtos (com estoque) |
| `PATCH` | `/api/snackbar/products/:id/stock` | Ajustar estoque |
| `POST` | `/api/snackbar/sales` | Registrar venda |
| `GET` | `/api/snackbar/sales?from=&to=` | Histórico de vendas por período |
| `GET` | `/api/snackbar/reports/top-products` | Produtos mais vendidos |

### Checklist de Entrega — Lanchonete
- [ ] Migration com `snackbar_products` e `snackbar_sales`
- [ ] CRUD de produtos
- [ ] Venda desconta estoque automaticamente
- [ ] Relatório: faturamento por dia/mês/ano
- [ ] Relatório: top produtos e top categorias
- [ ] Frontend: tela de ponto de venda (PDV) simplificado
- [ ] Frontend: tela de gestão de produtos e estoque
- [ ] Gráficos: comparativos de período

---

## Módulo 4 — Loja

> Mesma estrutura da Lanchonete. Implementar em paralelo ou logo após.

### Diferenças em relação à Lanchonete
- Categoria de produtos diferente (equipamentos, acessórios, BBs etc.)
- Vendas podem gerar comissão ou custo de reposição (regra a definir com o usuário)
- Tabelas: `store_products`, `store_sales` (mesmo padrão da lanchonete)

---

## Módulo 5 — Gestão / Relatórios

> Implementar depois de todos os módulos de lançamento.

### Dados consolidados por jogo/dia/mês/ano
- Faturamento total, por modalidade (equipado/aluguel), por recargas, por lanchonete, por loja
- Quantidade de jogadores: equipados, aluguel, avulsos
- Ticket médio por jogador
- Custo estimado de recargas e locações

### Estratégia
Usar a tabela `consolidated_daily_revenue` (já no schema) como cache de leitura. Populada automaticamente ao `FINISH` de cada jogo via trigger ou chamada no service.

---

## Módulo 6 — Gráficos + Projeção IA

> Implementar por último, depois de pelo menos 1 mês de dados reais.

### Comparativos
- Mês atual vs mesmo mês do ano anterior
- Ano atual vs ano anterior
- Múltiplos anos sobrepostos

### Projeção IA
- Só ativar após 3 meses de dados consolidados (regra de negócio)
- Modelo: regressão linear ou integração com API externa (Claude AI / OpenAI)
- Saída: projeção mês a mês para o ano seguinte

---

## Referência Rápida — Padrões do Projeto

### Estrutura de pasta (Backend)
```
backend/src/modules/<modulo>/
  <modulo>.types.ts
  <modulo>.repository.ts
  <modulo>.service.ts
  <modulo>.controller.ts
  <modulo>.routes.ts
  <modulo>.routes.test.ts
```

### Estrutura de pasta (Frontend)
```
frontend/src/features/<modulo>/
  types.ts
  api/<modulo>Api.ts
  components/
    <Componente>.tsx
```

### Resposta padrão da API
```json
{ "success": true, "data": <payload> }
{ "success": false, "error": "<mensagem>" }
```

### Migrations
- Arquivo: `supabase/migrations/YYYYMMDDHHMMSS_<descricao>.sql`
- Sempre usar `if not exists` e `do $$ begin ... exception when duplicate_object then null; end $$` para enums
- Sempre habilitar RLS nas tabelas novas
- Reutilizar a função `set_updated_at()` já criada na migration dos players
