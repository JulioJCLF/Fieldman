do $$ begin
  create type public.game_type   as enum ('OPEN', 'PRIVATE');
  create type public.game_status as enum ('SCHEDULED', 'IN_PROGRESS', 'FINISHED');
exception when duplicate_object then null; end $$;

create table if not exists public.games (
  id         uuid primary key default gen_random_uuid(),
  type       public.game_type   not null,
  game_date  date               not null default current_date,
  status     public.game_status not null default 'SCHEDULED',
  notes      text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists games_status_idx on public.games (status);
create index if not exists games_date_idx   on public.games (game_date);

-- Garante que apenas 1 jogo pode estar IN_PROGRESS por vez no nível do banco
create unique index if not exists games_single_active
  on public.games (status)
  where status = 'IN_PROGRESS';

drop trigger if exists games_set_updated_at on public.games;
create trigger games_set_updated_at
  before update on public.games
  for each row execute function public.set_updated_at();

alter table public.games enable row level security;
