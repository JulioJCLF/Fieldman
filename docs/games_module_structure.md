# Games Module — Estrutura Criada

> Documento gerado em 2026-08-08. Descreve todos os arquivos criados para o módulo de Jogos e a responsabilidade de cada um.

---

## Visão Geral

O módulo Games gerencia o ciclo de vida de um jogo (aberto ou fechado): criação, início, finalização. Ele é a âncora para os módulos de Tabs/Check-in que virão em seguida.

**Regra principal:** só pode existir **1 jogo `IN_PROGRESS`** por vez. Garantido tanto no service (verificação antes de iniciar) quanto no banco (unique index parcial).

---

## Banco de Dados

### `supabase/migrations/20260808000000_create_games.sql`
Cria a tabela `games` e os enums `game_type` e `game_status`.

| Coluna | Tipo | Detalhe |
|---|---|---|
| `id` | UUID PK | Gerado automaticamente |
| `type` | Enum `OPEN \| PRIVATE` | Tipo de jogo |
| `game_date` | Date | Default: dia atual |
| `status` | Enum `SCHEDULED \| IN_PROGRESS \| FINISHED` | Default: SCHEDULED |
| `notes` | Text nullable | Observações livres |
| `created_at` / `updated_at` | Timestamptz | Trigger automático no update |

**Índices:**
- `games_status_idx` — busca rápida por status
- `games_date_idx` — listagem por data
- `games_single_active` *(unique parcial)* — impede dois jogos `IN_PROGRESS` simultâneos no banco

---

## Backend

### `backend/src/modules/games/`

```
game.types.ts       ← Interfaces e tipos exportados
game.schemas.ts     ← Validação Zod das entradas HTTP
game.repository.ts  ← Acesso ao Supabase (implementa GamesRepository)
game.service.ts     ← Regras de negócio (implementa GameServicePort)
game.controller.ts  ← Handlers Express (chama o service, devolve JSON)
game.routes.ts      ← Monta o Router e associa controller aos endpoints
```

---

### `game.types.ts`
Define os contratos TypeScript do módulo.

| Exportação | Descrição |
|---|---|
| `GAME_TYPES` | Array literal `['OPEN', 'PRIVATE']` |
| `GAME_STATUSES` | Array literal `['SCHEDULED', 'IN_PROGRESS', 'FINISHED']` |
| `GameType` | Union derivada de `GAME_TYPES` |
| `GameStatus` | Union derivada de `GAME_STATUSES` |
| `Game` | Shape completo retornado pela API |
| `CreateGameInput` | Payload validado para criação |
| `GamesRepository` | Interface que o repository implementa |

---

### `game.schemas.ts`
Validação Zod. Expõe duas funções:

| Função | Input | Saída |
|---|---|---|
| `parseCreateGame(input)` | `request.body` | `CreateGameInput` |
| `parseGameId(input)` | `request.params.id` | `string` (UUID válido) |

Regras do schema de criação:
- `type`: obrigatório, deve ser `OPEN` ou `PRIVATE`
- `game_date`: opcional — default é hoje (`YYYY-MM-DD`) se não enviado
- `notes`: opcional, máx 500 chars, sanitizado (string vazia → `undefined`)

---

### `game.repository.ts`
`SupabaseGamesRepository` implementa `GamesRepository`.

| Método | SQL equivalente |
|---|---|
| `create(input)` | `INSERT INTO games ... RETURNING *` |
| `findById(id)` | `SELECT ... WHERE id = $1` |
| `findActive()` | `SELECT ... WHERE status = 'IN_PROGRESS'` |
| `updateStatus(id, status)` | `UPDATE games SET status = $2 WHERE id = $1 RETURNING *` |
| `listByDate(date)` | `SELECT ... WHERE game_date = $1 ORDER BY created_at DESC` |

---

### `game.service.ts`
`GameService` implementa `GameServicePort`. Contém as regras de negócio.

| Método | Lógica |
|---|---|
| `create(input)` | Bloqueia se já houver um `IN_PROGRESS`; delega criação ao repository |
| `start(id)` | Verifica status `SCHEDULED`; bloqueia se já houver `IN_PROGRESS`; muda para `IN_PROGRESS` |
| `finish(id)` | Verifica status `IN_PROGRESS`; muda para `FINISHED` |
| `getActive()` | Delega direto ao repository |
| `getById(id)` | Chama `requireGame` — lança 404 se não encontrado |
| `listByDate(date)` | Delega direto ao repository |

---

### `game.controller.ts`
`GameController` — um método por endpoint, todos com `try/catch` delegando ao `next(error)`.

| Método | HTTP | Rota |
|---|---|---|
| `create` | POST | `/api/games` |
| `start` | PATCH | `/api/games/:id/start` |
| `finish` | PATCH | `/api/games/:id/finish` |
| `getActive` | GET | `/api/games/active` |
| `getById` | GET | `/api/games/:id` |
| `listByDate` | GET | `/api/games?date=YYYY-MM-DD` |

---

### `game.routes.ts`
Cria o `Router` e liga cada rota ao método do controller. **Atenção à ordem:** `/active` deve vir antes de `/:id` para não ser capturado como parâmetro.

---

### Arquivos atualizados

**`backend/src/app.ts`**
- Adicionado `gameService` em `AppDependencies`
- Registrado `app.use('/api/games', createGameRouter(gameService))`

**`backend/src/server.ts`**
- `supabase` client extraído em variável compartilhada
- Instanciados `SupabaseGamesRepository` + `GameService` e passados para `createApp`

---

## Frontend

### `frontend/src/features/games/`

```
types.ts                        ← Tipos espelhados do backend
api/
  gamesApi.ts                   ← Funções fetch para cada endpoint
components/
  GamePanel.tsx                 ← Orquestra estado e renderiza o sub-componente certo
  GameStatusBanner.tsx          ← Faixa de "jogo em andamento" com indicador pulsante
  CreateGameForm.tsx            ← Formulário: tipo (OPEN/PRIVATE) + notas
  GameSummaryCard.tsx           ← Card com contadores + botão de finalizar jogo
```

---

### `types.ts`
Espelha os tipos do backend. Mesmos enums e interfaces `Game` e `CreateGamePayload`.

---

### `api/gamesApi.ts`
Funções assíncronas que chamam a API REST. Segue exatamente o padrão de `playersApi.ts`.

| Função | Método | Endpoint |
|---|---|---|
| `createGame(payload)` | POST | `/api/games` |
| `startGame(id)` | PATCH | `/api/games/:id/start` |
| `finishGame(id)` | PATCH | `/api/games/:id/finish` |
| `getActiveGame()` | GET | `/api/games/active` |

---

### `GamePanel.tsx`
Componente raiz do módulo. Responsável por:
1. Buscar o jogo ativo ao montar (`getActiveGame`)
2. Exibir estado de carregamento / erro de inicialização
3. Se **sem jogo ativo**: mostrar botão "Abrir novo jogo" + `CreateGameForm` quando clicado
4. Se **com jogo ativo**: mostrar `GameStatusBanner` + `GameSummaryCard`
5. Atualizar o estado local quando jogo é criado ou finalizado

---

### `GameStatusBanner.tsx`
Faixa visual no topo do painel. Mostra:
- Indicador pulsante verde (animação `animate-ping`)
- Tipo do jogo (JOGO ABERTO / JOGO FECHADO)
- Data do jogo formatada (dd/mm/yyyy)
- Label "EM ANDAMENTO"

---

### `CreateGameForm.tsx`
Formulário com:
- Radio buttons estilizados para tipo (ABERTO / FECHADO)
- Textarea para observações (opcional)
- Ao submeter: chama `createGame` → `startGame` em sequência
- Exibe erro inline se qualquer chamada falhar

---

### `GameSummaryCard.tsx`
Card do jogo ativo com:
- Grid de 3 contadores: Equipados / Aluguéis / Faturamento *(placeholder `—` até módulo Tabs)*
- Nota sobre os contadores
- Observações do jogo (se houver)
- Botão "Finalizar jogo" com confirmação de 2 etapas (clicar → confirmar)
- Chama `finishGame(id)` e sinaliza ao `GamePanel` via `onGameFinished`

---

### `frontend/src/App.tsx` (atualizado)
- Importado `GamePanel`
- Renderizado acima da seção de Players, separado por `mt-10`

---

## Endpoints Resumidos

| Método | Rota | Status de sucesso | Possíveis erros |
|---|---|---|---|
| POST | `/api/games` | 201 | 409 (já existe jogo ativo), 400 (validação) |
| PATCH | `/api/games/:id/start` | 200 | 404 (não encontrado), 409 (já ativo), 422 (status inválido) |
| PATCH | `/api/games/:id/finish` | 200 | 404, 422 (não está IN_PROGRESS) |
| GET | `/api/games/active` | 200 (`null` se nenhum) | — |
| GET | `/api/games/:id` | 200 | 404 |
| GET | `/api/games?date=` | 200 (array) | — |

---

## Próximo passo

Com Games implementado, o próximo módulo é **Tabs / Check-in** (`docs/implementation_guide.md` → Módulo 2).
Ele usa `game_id` como FK — portanto depende deste módulo estar funcional primeiro.
