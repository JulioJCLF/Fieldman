# Inventory Module (Lanchonete + Loja) — Estrutura Criada

> Documento gerado em 2026-08-08. Descreve todos os arquivos criados para os módulos de **Lanchonete** e **Loja**, implementados como um único módulo `inventory` parametrizado por canal.

---

## Decisão de Arquitetura

Lanchonete e Loja têm estrutura **idêntica** no Excel de requisitos (controle de estoque, cadastro de produtos, custo, valor de venda, faturamento, produtos mais vendidos, por categoria, gráficos). Por isso foram implementados como **um único módulo** `inventory` com uma coluna discriminadora `channel` (`SNACKBAR` | `STORE`).

**Vantagens:**
- Uma única fonte de verdade — correções e melhorias valem para os dois canais
- Sem duplicação de ~12 arquivos (`snackbar_*` + `store_*`)
- Um único conjunto de rotas, tipos e componentes

**Como os canais são distinguidos:**
- No banco: coluna `channel` nas tabelas `inventory_products` e `inventory_sales`
- Na API: segmento de URL `/api/inventory/:channel/...` onde `:channel` é `snackbar` ou `store`
- No frontend: prop `channel` passada ao `InventoryPanel`

---

## Banco de Dados

### `supabase/migrations/20260808000002_create_inventory.sql`
Cria o enum `inventory_channel` e duas tabelas.

#### Tabela `inventory_products`

| Coluna | Tipo | Detalhe |
|---|---|---|
| `id` | UUID PK | Auto-gerado |
| `channel` | `inventory_channel` | SNACKBAR ou STORE |
| `name` | varchar(120) | Nome do produto (2–120 chars) |
| `category` | varchar(80) | Default `Geral` |
| `cost_price` | numeric(10,2) | Custo de aquisição |
| `sale_price` | numeric(10,2) | Preço de venda |
| `stock_qty` | int | Estoque atual (≥ 0) |
| `active` | boolean | Default `true` — produto inativo não pode ser vendido |
| `created_at` / `updated_at` | timestamptz | Trigger automático |

Índices: `channel`, `(channel, category)`.

#### Tabela `inventory_sales`

| Coluna | Tipo | Detalhe |
|---|---|---|
| `id` | UUID PK | Auto-gerado |
| `channel` | `inventory_channel` | Canal da venda |
| `product_id` | UUID FK → `inventory_products` | Produto vendido |
| `tab_id` | UUID FK → `tabs`, nullable | Vincula a venda a uma comanda (opcional) |
| `quantity` | int | Quantidade vendida (> 0) |
| `unit_price` | numeric(10,2) | Preço unitário no momento da venda (snapshot) |
| `total_price` | numeric(10,2) | `unit_price × quantity` |
| `sold_at` | timestamptz | Data/hora da venda |

Índices: `(channel, sold_at)`, `product_id`, `tab_id`.

**Nota:** `unit_price` é gravado como snapshot no momento da venda — alterar o preço do produto depois não afeta vendas passadas.

---

## Backend

### `backend/src/modules/inventory/`

```
inventory.types.ts       ← Tipos, enum e interface do repositório
inventory.schemas.ts     ← Validação Zod + parsing de canal, faixas de data, limites
inventory.repository.ts  ← Acesso ao Supabase + agregações de relatório
inventory.service.ts     ← Regras de negócio (estoque, produto ativo)
inventory.controller.ts  ← Handlers Express
inventory.routes.ts      ← Router único com :channel dinâmico
```

---

### `inventory.types.ts`

| Exportação | Descrição |
|---|---|
| `INVENTORY_CHANNELS` / `InventoryChannel` | `['SNACKBAR', 'STORE']` e seu type |
| `Product` | Produto completo |
| `Sale` | Venda completa |
| `CreateProductInput`, `UpdateProductInput`, `RecordSaleInput` | Payloads |
| `RevenueSummary` | `{ units_sold, revenue, cost, profit, sales_count }` |
| `TopProduct`, `TopCategory` | Linhas de relatório agregado |
| `DateRange` | Faixa `{ from, to }` em ISO |
| `InventoryRepository` | Interface do repositório |

---

### `inventory.schemas.ts`
Validação Zod. Funções expostas:

| Função | Responsabilidade |
|---|---|
| `parseChannel(input)` | Mapeia slug `snackbar`/`store` → enum; lança erro se inválido |
| `parseCreateProduct(body, channel)` | Valida payload de criação |
| `parseUpdateProduct(body)` | Valida update parcial (exige ≥ 1 campo) |
| `parseStockDelta(body)` | Valida `{ delta: int }` |
| `parseRecordSale(body, channel)` | Valida venda (`product_id`, `quantity`, `tab_id?`) |
| `parseProductId(input)` | Valida UUID |
| `parseDateRange(query)` | Faixa com default: início do mês corrente → agora |
| `parseLimit(input, fallback)` | Limita top-N entre 1 e 100 |

---

### `inventory.repository.ts`
`SupabaseInventoryRepository` implementa `InventoryRepository`.

| Método | Descrição |
|---|---|
| `createProduct` / `listProducts` / `findProductById` / `updateProduct` | CRUD de produtos filtrado por `channel` |
| `adjustStock(channel, id, novoTotal)` | Grava o novo total de estoque (service calcula) |
| `recordSale(input, unitPrice, newStock)` | Insere venda + decrementa estoque |
| `listSales(channel, range)` | Vendas no período |
| `getRevenueSummary(channel, range)` | Agrega faturamento, custo e lucro (join com custo do produto) |
| `getTopProducts(channel, range, limit)` | Agrega por produto, ordena por unidades |
| `getTopCategories(channel, range)` | Agrega por categoria, ordena por faturamento |

**Helper `relationOne`:** o Supabase infere relações embutidas (join) como array mesmo em FKs 1:1. Esse helper normaliza array ou objeto para um único valor. Agregações de relatório são feitas em JS a partir das linhas retornadas.

---

### `inventory.service.ts`
`InventoryService` implementa `InventoryServicePort`. Regras de negócio:

| Método | Regra |
|---|---|
| `adjustStock` | Bloqueia se o novo total ficaria negativo (422) |
| `recordSale` | Verifica produto ativo (422) e estoque suficiente (422); passa `sale_price` e novo estoque ao repository |
| `getProduct` / `updateProduct` | `requireProduct` — lança 404 se não existe |
| demais | Delegação direta |

---

### `inventory.controller.ts`
`InventoryController` — 10 handlers, todos com `try/catch → next(error)`.

---

### `inventory.routes.ts`
`createInventoryRouter(service)` — montado em `app.use('/api/inventory', ...)`.

| Método | Rota | Ação |
|---|---|---|
| GET | `/:channel/reports/summary` | Faturamento/lucro/unidades no período |
| GET | `/:channel/reports/top-products` | Produtos mais vendidos |
| GET | `/:channel/reports/top-categories` | Vendas por categoria |
| POST | `/:channel/sales` | Registrar venda |
| GET | `/:channel/sales` | Histórico de vendas |
| POST | `/:channel/products` | Cadastrar produto |
| GET | `/:channel/products` | Listar produtos |
| GET | `/:channel/products/:id` | Detalhe do produto |
| PATCH | `/:channel/products/:id` | Editar produto |
| PATCH | `/:channel/products/:id/stock` | Ajustar estoque (`{ delta }`) |

**Ordem:** rotas de `reports` e `sales` declaradas antes de `products/:id` para evitar colisão de parâmetros.

---

### Arquivos atualizados

**`backend/src/app.ts`**
- Adicionado `inventoryService: InventoryServicePort` em `AppDependencies`
- Registrado `app.use('/api/inventory', createInventoryRouter(inventoryService))`

**`backend/src/server.ts`**
- Instanciados `SupabaseInventoryRepository` + `InventoryService`

**`backend/src/modules/players/player.routes.test.ts`**
- `createTestApp` atualizado com mock de `inventoryService`

---

## Frontend

### `frontend/src/features/inventory/`

```
types.ts                       ← Tipos espelhados + CHANNEL_SLUG / CHANNEL_LABEL
format.ts                      ← formatCurrency, parseDecimal, rangeForPeriod
api/
  inventoryApi.ts              ← Fetch de todos os endpoints (base por canal)
components/
  InventoryPanel.tsx           ← Orquestra abas Venda / Produtos / Relatórios
  ProductForm.tsx              ← Cadastro de produto (nome, categoria, custo, venda, estoque)
  ProductRow.tsx               ← Linha de produto com ajuste de estoque (+entrada / −baixa)
  SalePosForm.tsx              ← Ponto de venda (seleciona produto, qtd, registra)
  ReportsPanel.tsx             ← Faturamento + mais vendidos + por categoria, por período
```

---

### `types.ts`
Espelha os tipos do backend. Extras do frontend:
- `CHANNEL_SLUG` — mapeia enum → segmento de URL (`SNACKBAR` → `snackbar`)
- `CHANNEL_LABEL` — mapeia enum → rótulo em PT (`SNACKBAR` → `Lanchonete`)

### `format.ts`
- `formatCurrency(value)` — formata em BRL
- `parseDecimal(value)` — converte `"12,50"` → `12.5`
- `rangeForPeriod('day'|'month'|'year')` — gera faixa de datas para os filtros de relatório

### `api/inventoryApi.ts`
Funções fetch, todas prefixadas por `/api/inventory/{slug}`:
`listProducts`, `createProduct`, `updateProduct`, `adjustStock`, `recordSale`, `getRevenueSummary`, `getTopProducts`, `getTopCategories`.

---

### `InventoryPanel.tsx`
Componente raiz, recebe `channel`. Gerencia:
1. Carregamento da lista de produtos
2. Abas internas: **Venda** (PDV), **Produtos** (catálogo/estoque), **Relatórios**
3. Estado local sincronizado após venda/ajuste (sem re-fetch desnecessário)
4. `refreshKey` incrementado a cada venda para recarregar relatórios

### `ProductForm.tsx`
Formulário de cadastro: nome, categoria, custo, preço de venda, estoque inicial.

### `ProductRow.tsx`
Card de produto com: nome, categoria, preço/custo/margem, estoque (destaque amber se ≤ 5) e controles inline de **+Entrada** / **−Baixa** de estoque.

### `SalePosForm.tsx`
Ponto de venda simplificado: seleciona produto disponível (ativo e com estoque), quantidade, mostra total calculado e registra a venda. Só lista produtos com estoque > 0.

### `ReportsPanel.tsx`
Relatórios com seletor de período (Hoje / Mês / Ano):
- Cartões: Faturamento, Lucro, Unidades, Nº de vendas
- Lista: Produtos mais vendidos
- Lista: Vendas por categoria

Atende aos requisitos do Excel: *"FATURAMENTO (Dia, mês, ano)"*, *"Produtos mais vendidos"*, *"Produtos mais vendidos por categorias"*.

---

### `frontend/src/App.tsx` (atualizado)
- Adicionada **navegação por abas** no header: Operação / Lanchonete / Loja
- View `operation` mantém Games + Players
- Views `snackbar` e `store` renderizam `<InventoryPanel channel=... />`

---

## Cobertura do Excel

| Requisito (Excel) | Implementado |
|---|---|
| Controle de estoque | ✅ `stock_qty` + ajuste inline + baixa automática na venda |
| Cadastro de produtos | ✅ `ProductForm` |
| Custo | ✅ `cost_price` |
| Valor de venda | ✅ `sale_price` |
| Faturamento (dia/mês/ano) | ✅ `ReportsPanel` com seletor de período |
| Produtos mais vendidos | ✅ `getTopProducts` |
| Produtos mais vendidos por categoria | ✅ `getTopCategories` |
| Comparação de períodos / projeção IA | ⬜ Módulo de Gráficos (próximo) |

---

## Ponto de integração futuro

`inventory_sales.tab_id` já permite vincular uma venda à comanda de um jogador (Excel: *"Gasto na loja"*, *"Gasto na lanchonete"* no perfil do cliente). A UI atual registra vendas diretas (avulsas); a venda vinculada à comanda pode ser adicionada na tela de check-in reutilizando `recordSale({ tab_id })`.

---

## Próximo passo

Restam os módulos **Gestão / Relatórios consolidados** e **Gráficos + Projeção IA** (`docs/implementation_guide.md` → Módulos 5 e 6).
