-- Player registration is owned by the backend API. The identity column assigns
-- registration numbers atomically and avoids unsafe MAX(registration_number) logic.
create extension if not exists pgcrypto;

do $$
begin
  create type public.player_client_type as enum ('OPEN_GAME', 'PRIVATE_GAME', 'BOTH');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  registration_number bigint generated always as identity not null unique,
  name varchar(120) not null check (char_length(btrim(name)) between 2 and 120),
  cpf varchar(11) not null unique check (cpf ~ '^[0-9]{11}$'),
  phone varchar(13) not null check (phone ~ '^55[1-9][0-9]{9,10}$'),
  email varchar(254) not null,
  date_of_birth date not null,
  client_type public.player_client_type not null default 'BOTH',
  profile text,
  terms_accepted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on column public.players.date_of_birth is
  'Required by the rapid-registration business rule; added to reconcile the table summary with the specification.';

create index if not exists players_phone_idx on public.players (phone);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists players_set_updated_at on public.players;
create trigger players_set_updated_at
before update on public.players
for each row execute function public.set_updated_at();

alter table public.players enable row level security;

-- No browser policy is created: all player data access goes through the backend
-- with a server-only Supabase service-role client, as required by the architecture.
