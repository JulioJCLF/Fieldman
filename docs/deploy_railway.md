# Deploy no Railway

O Fieldman é um monorepo npm workspaces com dois apps:

- **`@fieldman/api`** — backend Express (Node). Fala com o Supabase usando a
  `service_role` key (secret, só no servidor).
- **`@fieldman/web`** — frontend React/Vite (estático). Fala **apenas** com o
  backend e com o Supabase Auth (chave publishable).

A recomendação é criar **dois serviços** no mesmo projeto Railway, ambos
apontando para este repositório do GitHub (`JulioJCLF/Fieldman`). O Railway
builda a partir do GitHub, então todo deploy sai de um push na `main`.

O banco (Supabase) já está na nuvem — o Railway **não** hospeda o Postgres.

---

## 1. Criar o projeto

1. Acesse https://railway.app e faça login com o GitHub.
2. **New Project → Deploy from GitHub repo → `JulioJCLF/Fieldman`**.
3. O Railway cria um primeiro serviço. Vamos configurá-lo como **api** e depois
   adicionar um segundo serviço **web** (**+ New → GitHub Repo**, mesmo repo).

---

## 2. Serviço `api` (backend)

Em **Settings** do serviço:

| Campo | Valor |
| --- | --- |
| Root Directory | *(vazio — usa a raiz do repo)* |
| Build Command | `npm ci && npm run build --workspace @fieldman/api` |
| Start Command | `npm run start --workspace @fieldman/api` |

Em **Variables** (aba Variables):

| Variável | Valor |
| --- | --- |
| `SUPABASE_URL` | `https://aeuawmpctlhbwlornrcv.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | *(a service role key — Dashboard Supabase → Project Settings → API)* |
| `CORS_ORIGIN` | *(a URL pública do serviço **web**, ex.: `https://fieldman-web.up.railway.app`)* |
| `PAYMENTS_MODE` | `mock` *(troque para `live` + `MERCADOPAGO_ACCESS_TOKEN` quando for cobrar de verdade)* |

> O `PORT` é injetado automaticamente pelo Railway e o app já o lê. Não defina
> `PORT` manualmente.

Em **Settings → Networking → Generate Domain** para obter a URL pública da API.

---

## 3. Serviço `web` (frontend)

Em **Settings**:

| Campo | Valor |
| --- | --- |
| Root Directory | *(vazio — usa a raiz do repo)* |
| Build Command | `npm ci && npm run build --workspace @fieldman/web` |
| Start Command | `npm run start --workspace @fieldman/web` |

O `start` do web usa `serve -s dist -l $PORT` (servidor estático com fallback
SPA, então `/register` funciona em deep link).

Em **Variables** (estas são lidas em **tempo de build** pelo Vite — se mudar,
precisa **rebuildar**):

| Variável | Valor |
| --- | --- |
| `VITE_API_BASE_URL` | *(a URL pública do serviço **api**, ex.: `https://fieldman-api.up.railway.app`)* |
| `VITE_SUPABASE_URL` | `https://aeuawmpctlhbwlornrcv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_yhnmmmzB1-JjfG_NZdn2lw_j4zYmEyA` |

Gere o domínio público do web em **Settings → Networking → Generate Domain**.

---

## 4. Ordem de deploy (resolvendo o ovo-e-galinha das URLs)

O front precisa da URL da api (build-time) e a api precisa da URL do front (CORS).

1. Suba os **dois** serviços e gere o domínio de cada um.
2. No **api**, defina `CORS_ORIGIN` = URL do **web** → o Railway redeploya.
3. No **web**, defina `VITE_API_BASE_URL` = URL do **api** → **rebuild** (o
   valor entra no bundle).
4. Pronto: abra a URL do web, faça login com o usuário de staff.

Dica: para URLs estáveis, use **Custom Domains** (ex.: `app.seudominio.com` e
`api.seudominio.com`) desde o início e evite rebuilds por troca de URL.

---

## 5. Usuários de staff

O app é **staff-only** (login por e-mail/senha via Supabase Auth); o cadastro de
jogador em `/register` é público. Crie/garanta os usuários em
**Supabase Dashboard → Authentication → Users → Add user** (marque *Auto Confirm
User*). Já existe `admin@fieldman.app` criado para o primeiro acesso — **troque a
senha**.

---

## 6. Supabase: RLS e migrations

- As tabelas têm **RLS habilitado** sem políticas. O backend usa `service_role`
  (bypassa RLS), então funciona; acesso direto com a chave publishable é negado.
- Novas migrations em `supabase/migrations/` são aplicadas com
  `npx supabase db push` (CLI já linkado ao projeto `aeuawmpctlhbwlornrcv`).

---

## 7. Alternativa mais barata: serviço único

O Railway cobra por serviço. Para economizar, dá para servir o frontend
**a partir do próprio Express** (um único serviço, sem CORS): buildar o web,
copiar o `dist/` e adicionar um middleware estático + fallback SPA no backend.
Não está configurado hoje; peça se quiser migrar para esse modelo.
