-- Habilita Row Level Security em todas as tabelas de negócio.
--
-- A aplicação acessa o banco exclusivamente pelo backend, que usa a chave
-- service_role (bypassa RLS). Sem políticas, qualquer acesso direto com a chave
-- anon/publishable (exposta no frontend) é negado — defesa em profundidade caso
-- a chave pública vaze. Se no futuro o frontend precisar consultar tabelas
-- diretamente, adicione políticas específicas por tabela.

alter table public.players             enable row level security;
alter table public.games               enable row level security;
alter table public.tabs                enable row level security;
alter table public.consumables_refills enable row level security;
alter table public.gateway_payments    enable row level security;
alter table public.inventory_products  enable row level security;
alter table public.inventory_sales     enable row level security;
