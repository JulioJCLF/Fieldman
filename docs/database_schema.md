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