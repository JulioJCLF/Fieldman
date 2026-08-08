# Database Schema (Supabase / PostgreSQL)

## Core Tables

### `players` (`jogadores`)
- `id` (UUID, PK)
- `registration_number` (Int, Sequential, Indexed)
- `name`, `cpf` (Unique), `phone`, `email`
- `client_type` (Enum: OPEN_GAME, PRIVATE_GAME, BOTH)
- `profile` (Text)
- `terms_accepted` (Boolean)

### `games` (`jogos`)
- `id` (UUID, PK)
- `type` (Enum: OPEN, PRIVATE)
- `game_date` (Date)
- `status` (Enum: SCHEDULED, IN_PROGRESS, FINISHED)

### `tabs` (`comandas` - Check-in Management)
- `id` (UUID, PK)
- `game_id` (FK -> games)
- `player_id` (FK -> players, Nullable for walk-ins)
- `modality` (Enum: EQUIPPED, RENTAL)
- `entry_fee` (Decimal)
- `entry_status` (Enum: PENDING, PAID)

### `consumables_refills` (`consumo_recargas`)
- `id` (UUID, PK)
- `tab_id` (FK -> tabs)
- `item_type` (Enum: REFILL, SNACKBAR, STORE)
- `description` (String)
- `quantity` (Int)
- `total_price` (Decimal)
- `payment_status` (Enum: PAID, OPEN)

### `gateway_payments` (`pagamentos_gateway`)
- `id` (UUID, PK)
- `tab_id` (FK -> tabs)
- `gateway_transaction_id` (String)
- `method` (Enum: PIX, CARD, CASH)
- `amount` (Decimal)
- `status` (Enum: PENDING, APPROVED, REJECTED, REFUNDED)

### `consolidated_daily_revenue` (`faturamento_diario_consolidado` - Optimization for Charts/AI)
- `id` (UUID, PK)
- `reference_date` (Date, Unique)
- `total_revenue`, `rental_revenue`, `equipped_revenue`, `refills_revenue`, `snackbar_revenue` (Decimals)
- `weather` (String)

### `inventory_products` (`produtos` - Lanchonete + Loja unificados)
- `id` (UUID, PK)
- `channel` (Enum: SNACKBAR, STORE) — discrimina Lanchonete vs Loja
- `name`, `category`
- `cost_price`, `sale_price` (Decimals)
- `stock_qty` (Int)
- `active` (Boolean)

### `inventory_sales` (`vendas` - Lanchonete + Loja unificados)
- `id` (UUID, PK)
- `channel` (Enum: SNACKBAR, STORE)
- `product_id` (FK -> inventory_products)
- `tab_id` (FK -> tabs, Nullable — vincula venda à comanda)
- `quantity` (Int)
- `unit_price`, `total_price` (Decimals — snapshot no momento da venda)
- `sold_at` (Timestamp)

> **Nota de implementação:** Lanchonete e Loja compartilham as tabelas `inventory_*` (discriminadas por `channel`) ao invés de tabelas separadas `snackbar_*` / `store_*`, dada a estrutura idêntica. Ver `docs/inventory_module_structure.md`.