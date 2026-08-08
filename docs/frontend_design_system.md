# Frontend — Estrutura & Design System

> Documento gerado em 2026-08-08. Descreve a camada compartilhada do frontend: cliente de API único, primitivos de UI e o padrão de estrutura por feature.

---

## Cliente de API único — `src/lib/apiClient.ts`

Antes, cada feature repetia o mesmo `fetch` + `ApiError` + desempacotamento do envelope. Agora tudo passa por um cliente único.

| Export | Uso |
|---|---|
| `ApiError` | Erro tipado com `status` |
| `apiRequest<T>(path, init)` | Requisição crua com desempacotamento do envelope `{ success, data }` |
| `api.get/post/patch<T>` | Atalhos por verbo (serializam JSON, tratam AbortSignal) |
| `isAbortError` | Detecta cancelamento (não vira erro de UI) |

Cada feature (`features/*/api/*.ts`) importa `api`/`ApiError` e **re-exporta `ApiError`** para os componentes manterem o import local. Resultado: ~120 linhas duplicadas eliminadas em 6 features.

---

## Primitivos de UI — `src/components/ui/`

Biblioteca de componentes que encapsula os tokens visuais (tema tático: fundo `#0d120d`, acento `lime-300`, fonte mono, bordas, `tracking` em maiúsculas). Import único via barrel `components/ui`.

| Componente | Papel |
|---|---|
| `Button` | Variantes `primary`/`secondary`/`danger`/`ghost`, tamanhos `sm`/`md`, `block`. Default `type="button"` (evita submit acidental) |
| `Field` | Rótulo + controle + `hint` + `error` padronizados |
| `TextInput` / `Textarea` / `Select` | Controles de formulário com o estilo do sistema |
| `SegmentedControl<T>` | Grupo de botões mutuamente exclusivos (substitui os radios estilizados repetidos) com `aria-pressed` |
| `Alert` | Mensagens `error`/`success`/`warning`/`info` (borda lateral) |
| `Badge` | Selo de status (`neutral`/`success`/`warning`/`danger`/`info`) |
| `Card` | Painel bordado com cabeçalho opcional (título + ações) |
| `Modal` | Overlay + container + cabeçalho + botão fechar acessível |
| `formatCurrency` | Formatação BRL compartilhada |

### Componentes refatorados para o design system
- `games/CreateGameForm` → `Card`, `Field`, `SegmentedControl`, `Textarea`, `Alert`, `Button`
- `inventory/ProductForm` → `Card`, `Field`, `TextInput`, `Alert`, `Button`
- `tabs/RefillModal` → `Modal`, `Field`, `SegmentedControl`, `TextInput`, `Alert`, `Button`
- `tabs/CheckoutModal` → `Modal`, `SegmentedControl`, `Alert`, `Button`, `formatCurrency`

> Os demais componentes (painéis de exibição, gráficos) seguem o mesmo tema e podem adotar os primitivos incrementalmente — o padrão está estabelecido e testado.

---

## Robustez

- **`components/ErrorBoundary.tsx`** — captura erros de render em qualquer parte da árvore e mostra um fallback (com botão "Recarregar"), evitando tela branca. Envolve `<App>` em `main.tsx`.
- **Cliente de API** — trata falha de rede, envelope inválido e cancelamento de forma consistente em toda a aplicação.

---

## Estrutura por feature (mantida)

```
src/
  lib/apiClient.ts            ← infraestrutura HTTP compartilhada
  components/
    ui/                       ← design system (primitivos)
    ErrorBoundary.tsx
  features/<feature>/
    types.ts
    api/<feature>Api.ts       ← usa lib/apiClient
    components/*.tsx          ← usa components/ui
  test/setup.ts               ← setup do vitest (jsdom + jest-dom)
```

---

## Testes da camada compartilhada
- `components/ui/Button.test.tsx`, `SegmentedControl.test.tsx` — comportamento e acessibilidade dos primitivos
- `features/games/components/CreateGameForm.test.tsx` — fluxo do formulário com a API mockada

Ver `docs/testing_and_quality.md` para o harness completo.
