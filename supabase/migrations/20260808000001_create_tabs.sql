do $$ begin
  create type public.tab_modality      as enum ('EQUIPPED', 'RENTAL');
  create type public.entry_status      as enum ('PENDING', 'PAID');
  create type public.item_type         as enum ('REFILL', 'SNACKBAR', 'STORE');
  create type public.payment_status    as enum ('PAID', 'OPEN');
  create type public.payment_method    as enum ('PIX', 'CARD', 'CASH');
  create type public.payment_gw_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'REFUNDED');
exception when duplicate_object then null; end $$;

-- Comandas (check-in por jogador em um jogo)
create table if not exists public.tabs (
  id           uuid primary key default gen_random_uuid(),
  game_id      uuid not null references public.games(id),
  player_id    uuid references public.players(id),
  guest_name   varchar(120),
  player_name  varchar(120) not null,
  modality     public.tab_modality not null,
  entry_fee    numeric(10,2) not null default 0 check (entry_fee >= 0),
  entry_status public.entry_status not null default 'PENDING',
  created_at   timestamptz not null default timezone('utc', now()),
  updated_at   timestamptz not null default timezone('utc', now()),
  constraint tab_player_or_guest check (player_id is not null or guest_name is not null)
);

create index if not exists tabs_game_idx   on public.tabs (game_id);
create index if not exists tabs_player_idx on public.tabs (player_id);

-- Recargas e consumíveis vinculados a uma comanda
create table if not exists public.consumables_refills (
  id             uuid primary key default gen_random_uuid(),
  tab_id         uuid not null references public.tabs(id),
  item_type      public.item_type not null,
  description    varchar(200) not null,
  quantity       int not null default 1 check (quantity > 0),
  total_price    numeric(10,2) not null check (total_price >= 0),
  payment_status public.payment_status not null default 'OPEN',
  created_at     timestamptz not null default timezone('utc', now())
);

create index if not exists consumables_tab_idx on public.consumables_refills (tab_id);

-- Registros de pagamento vinculados a uma comanda
create table if not exists public.gateway_payments (
  id                     uuid primary key default gen_random_uuid(),
  tab_id                 uuid not null references public.tabs(id),
  gateway_transaction_id varchar(200),
  method                 public.payment_method not null,
  amount                 numeric(10,2) not null check (amount > 0),
  status                 public.payment_gw_status not null default 'APPROVED',
  created_at             timestamptz not null default timezone('utc', now())
);

create index if not exists payments_tab_idx on public.gateway_payments (tab_id);

drop trigger if exists tabs_set_updated_at on public.tabs;
create trigger tabs_set_updated_at
  before update on public.tabs
  for each row execute function public.set_updated_at();

alter table public.tabs                enable row level security;
alter table public.consumables_refills  enable row level security;
alter table public.gateway_payments     enable row level security;
