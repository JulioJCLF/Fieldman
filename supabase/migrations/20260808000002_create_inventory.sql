-- Módulo unificado de Lanchonete + Loja. As duas áreas compartilham estrutura
-- idêntica (produtos, estoque, custo, venda), diferenciadas apenas pela coluna
-- `channel`. Isso evita duplicar tabelas snackbar_* e store_*.
do $$ begin
  create type public.inventory_channel as enum ('SNACKBAR', 'STORE');
exception when duplicate_object then null; end $$;

create table if not exists public.inventory_products (
  id         uuid primary key default gen_random_uuid(),
  channel    public.inventory_channel not null,
  name       varchar(120) not null check (char_length(btrim(name)) between 2 and 120),
  category   varchar(80)  not null default 'Geral',
  cost_price numeric(10,2) not null default 0 check (cost_price >= 0),
  sale_price numeric(10,2) not null default 0 check (sale_price >= 0),
  stock_qty  int not null default 0 check (stock_qty >= 0),
  active     boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists inventory_products_channel_idx  on public.inventory_products (channel);
create index if not exists inventory_products_category_idx on public.inventory_products (channel, category);

create table if not exists public.inventory_sales (
  id          uuid primary key default gen_random_uuid(),
  channel     public.inventory_channel not null,
  product_id  uuid not null references public.inventory_products(id),
  tab_id      uuid references public.tabs(id),
  quantity    int not null check (quantity > 0),
  unit_price  numeric(10,2) not null check (unit_price >= 0),
  total_price numeric(10,2) not null check (total_price >= 0),
  sold_at     timestamptz not null default timezone('utc', now())
);

create index if not exists inventory_sales_channel_idx on public.inventory_sales (channel, sold_at);
create index if not exists inventory_sales_product_idx on public.inventory_sales (product_id);
create index if not exists inventory_sales_tab_idx     on public.inventory_sales (tab_id);

drop trigger if exists inventory_products_set_updated_at on public.inventory_products;
create trigger inventory_products_set_updated_at
  before update on public.inventory_products
  for each row execute function public.set_updated_at();

alter table public.inventory_products enable row level security;
alter table public.inventory_sales    enable row level security;
