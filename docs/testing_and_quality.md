# Testing & Quality Harness

> Documento gerado em 2026-08-08. Descreve a infraestrutura de qualidade: testes (unit, integração, E2E), lint, formatação e CI.

---

## Visão Geral

Objetivo: **shipar sempre com o maior nível de qualidade possível**. Toda mudança passa por um gate único (`npm run check`): lint → typecheck → testes → build. O E2E roda separado (precisa de browser).

| Camada | Ferramenta | Onde |
|---|---|---|
| Lint | ESLint 9 (flat config) + typescript-eslint | raiz (`eslint.config.js`) |
| Formatação | Prettier | raiz (`.prettierrc.json`) |
| Typecheck | TypeScript `--noEmit` | por workspace |
| Unit + Integração | Vitest (+ supertest no backend, + Testing Library no frontend) | por workspace |
| E2E | Playwright (Chromium) | `frontend/e2e` |
| CI | GitHub Actions | `.github/workflows/ci.yml` |

---

## Scripts (raiz)

| Comando | O que faz |
|---|---|
| `npm run check` | **Gate completo**: lint + typecheck + test + build |
| `npm run lint` / `lint:fix` | ESLint em backend e frontend |
| `npm run format` / `format:check` | Prettier (escreve / verifica) |
| `npm run typecheck` | `tsc --noEmit` nos dois workspaces |
| `npm test` | Vitest nos dois workspaces |
| `npm run test:e2e` | Playwright (frontend) |
| `npm run dev` | Sobe API + Web juntos |

---

## Backend — Vitest + Supertest

### Harness de testes: `backend/src/test/harness.ts`
`buildTestApp()` monta o app Express com **todos os serviços mockados** (vi.fn), retornando `{ app, services }`. Os testes configuram o comportamento via `services.<serviço>.<método>.mockResolvedValue(...)` e exercitam as rotas com supertest. Isso isola o teste de rota da camada de dados (Supabase).

### Cobertura por módulo
| Módulo | Testes de service (regras) | Testes de rota |
|---|---|---|
| players | schemas | ✅ criação, busca, 404 |
| games | ✅ jogo único ativo, transições, 404 | ✅ criar, iniciar, validação |
| tabs | ✅ check-in exige jogo ativo, cálculo do total, recarga paga | ✅ check-in, listagem, checkout |
| inventory | ✅ estoque insuficiente, produto inativo, ajuste negativo | ✅ canais, venda, ajuste de estoque |
| analytics | ✅ agregação sem sobreposição, threshold e regressão da projeção | — |
| payments | ✅ criação PIX, conciliação, webhook + mock gateway (timers falsos) | ✅ PIX, status, webhook |

**Total: ~57 testes.** Rodar: `npm test -w @fieldman/api`.

---

## Frontend — Vitest + Testing Library (jsdom)

- Config em `frontend/vite.config.ts` (`environment: 'jsdom'`, `setupFiles`), setup em `src/test/setup.ts` (jest-dom + cleanup).
- Testes de primitivos de UI (`Button`, `SegmentedControl`) e de fluxo de componente (`CreateGameForm` com a API mockada via `vi.mock`).
- Rodar: `npm test -w @fieldman/web`.

---

## E2E — Playwright

- Config em `frontend/playwright.config.ts`. O `webServer` sobe o Vite automaticamente; `baseURL` = `http://localhost:5173`.
- Os testes **interceptam `/api/*`** (`page.route`, helper `e2e/support/mockApi.ts`), então rodam **sem backend nem Supabase**.
- Exemplo: `e2e/checkin.spec.ts` — abre o jogo ativo e cria uma comanda de avulso pela UI real no Chromium.
- Setup local: `npx playwright install chromium` (uma vez). Rodar: `npm run test:e2e`.

---

## Lint & Format

- **ESLint flat config** (`eslint.config.js`): base JS + typescript-eslint; regras de React Hooks/Refresh só no frontend; regras afrouxadas em `*.test.*` (mocks). `eslint-config-prettier` desliga conflitos estilísticos.
  - `react-hooks/set-state-in-effect` está **desligada** de propósito: os efeitos de data-fetching definem `loading=true` de forma síncrona (sincronização legítima com API), não é efeito derivável.
- **Prettier** (`.prettierrc.json`): aspas simples, `printWidth` 120, `trailingComma: all`.

---

## CI — `.github/workflows/ci.yml`

Dois jobs em cada push/PR para `main`:
1. **quality**: `npm ci` → lint → typecheck → test → build
2. **e2e**: instala Chromium (`playwright install --with-deps`) → `test:e2e` → sobe `playwright-report` como artefato

---

## Como adicionar testes

- **Rota nova (backend):** use `buildTestApp()`, configure o mock do serviço, faça a chamada supertest, asserte status + envelope.
- **Regra de negócio (backend):** instancie o service com um repositório fake (objeto de `vi.fn()`), asserte o comportamento e o `statusCode` dos `HttpError`.
- **Componente (frontend):** `render()` + `screen`/`userEvent`; mocke a API do feature com `vi.mock('../api/...')`.
- **Fluxo E2E:** adicione rotas ao `mockApi.ts` e escreva o `.spec.ts` navegando pela UI.
