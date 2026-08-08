# Payments Module (Mercado Pago · PIX) — Estrutura Criada

> Documento gerado em 2026-08-08. Descreve o módulo `payments`, que integra o gateway de pagamento (Mercado Pago) para cobrança PIX com QR Code na tela, confirmação por webhook e conciliação automática da comanda.

---

## Visão Geral

Fluxo escolhido: **PIX via Checkout API do Mercado Pago**, com o QR Code exibido na tela da recepção. O cliente paga pelo celular e a comanda é liquidada automaticamente na confirmação.

```
Recepção → [Gerar PIX] → backend cria pagamento no MP
         → QR Code + copia-e-cola na tela
Cliente  → escaneia e paga pelo celular
MP       → webhook (ou polling) → status APPROVED
Backend  → concilia: marca comanda + recargas como PAGAS
Frontend → polling detecta aprovação → tela de sucesso
```

### Modo mock (sem credencial)
`PAYMENTS_MODE=mock` (default) permite exercitar o fluxo inteiro **sem credencial do Mercado Pago**: o gateway simulado gera um copia-e-cola fictício e aprova automaticamente após ~6 segundos, imitando a confirmação do banco. Basta trocar para `PAYMENTS_MODE=live` + `MERCADOPAGO_ACCESS_TOKEN` quando a credencial estiver disponível — nenhum código muda.

---

## Configuração de Ambiente (`config/env.ts` + `.env.example`)

| Variável | Descrição |
|---|---|
| `PAYMENTS_MODE` | `mock` (default) ou `live` |
| `MERCADOPAGO_ACCESS_TOKEN` | Access Token do MP. Obrigatório quando `live` (validado no schema) |
| `PUBLIC_BASE_URL` | URL pública do backend para o webhook (ex: túnel ngrok). Opcional |

---

## Banco de Dados

**Reutiliza a tabela `gateway_payments`** (já criada na migration de Tabs) — nenhuma migration nova.

| Coluna | Uso no PIX |
|---|---|
| `gateway_transaction_id` | ID do pagamento no Mercado Pago |
| `method` | `PIX` |
| `amount` | Total cobrado |
| `status` | `PENDING` → `APPROVED` (ou `REJECTED`/`REFUNDED`) |

---

## Backend

### `backend/src/modules/payments/`

```
payment.types.ts             ← Tipos, PixCharge, PaymentGatewayPort, PaymentsRepository
payment.schemas.ts           ← Validação + extração do id no webhook
payment.repository.ts        ← Acesso ao gateway_payments
payment.service.ts           ← Orquestra criação, polling, webhook e conciliação
payment.controller.ts        ← Handlers Express
payment.routes.ts            ← Router /api/payments
gateways/
  index.ts                   ← Factory: escolhe MP real ou mock conforme env
  mercadopago.gateway.ts     ← Integração real (fetch para api.mercadopago.com)
  mock.gateway.ts            ← Gateway simulado (aprova após ~6s)
  status-map.ts              ← Mapeia status do MP → enum interno
```

---

### `payment.types.ts`
Destaques:
- `PixCharge` — resposta ao frontend (`payment_id`, `status`, `amount`, `qr_code`, `qr_code_base64`, `ticket_url`, `expires_at`)
- `PaymentGatewayPort` — **abstração do provedor**: `createPix(input)` + `getPayment(id)` + `provider`. Permite trocar MP por mock (ou outro gateway) sem tocar no service.
- `PaymentsRepository` — `createPending`, `findById`, `findByGatewayTxId`, `updateStatus`

---

### `gateways/` — Padrão Adapter
| Arquivo | Papel |
|---|---|
| `mercadopago.gateway.ts` | POST `api.mercadopago.com/v1/payments` (payment_method_id `pix`, header `X-Idempotency-Key`); GET para consultar status |
| `mock.gateway.ts` | Sem rede: gera copia-e-cola fictício, guarda `createdAt` em memória, aprova após 6s |
| `status-map.ts` | `approved→APPROVED`, `rejected/cancelled→REJECTED`, `refunded/charged_back→REFUNDED`, resto→`PENDING` |
| `index.ts` | `createPaymentGateway(env)` — decide o adapter conforme `PAYMENTS_MODE` |

---

### `payment.service.ts`
`PaymentService` recebe `PaymentsRepository`, `PaymentGatewayPort` e `TabsRepository`.

| Método | Descrição |
|---|---|
| `createPixForTab(tabId)` | Calcula o total pendente da comanda; cria o PIX no gateway; grava `gateway_payments` como PENDING; retorna `PixCharge` |
| `getStatus(paymentId)` | Consulta nosso registro; se ainda pendente, consulta o gateway; se aprovado, **concilia**; retorna o pagamento atualizado (fallback quando não há webhook) |
| `handleWebhook(gatewayPaymentId)` | Busca o pagamento por `gateway_transaction_id`; consulta o gateway; se aprovado, concilia |
| `reconcileApproved` (privado) | Marca `gateway_payments` como APPROVED e chama `tabsRepo.settleTab` (marca comanda + recargas em aberto como pagas) |

**Reutilização:** a liquidação da comanda usa o novo método `TabsRepository.settleTab(tabId, openRefillIds)`, adicionado para separar "registrar pagamento" de "liquidar comanda".

---

### `payment.routes.ts`
Montado em `app.use('/api/payments', ...)`.

| Método | Rota | Ação |
|---|---|---|
| POST | `/api/payments/pix` | Cria cobrança PIX para uma comanda (`{ tab_id }`) |
| GET | `/api/payments/:paymentId` | Consulta status (usado no polling do frontend) |
| POST | `/api/payments/webhook` | Recebe notificações do Mercado Pago |

**Webhook:** responde sempre `200` (mesmo com ruído) para o MP não reenfileirar; erros são logados, não propagados. O id do pagamento é extraído de `body.data.id` ou da query (`?data.id=`/`?id=`).

---

### Arquivos atualizados
- **`config/env.ts`** — variáveis `PAYMENTS_MODE`, `MERCADOPAGO_ACCESS_TOKEN`, `PUBLIC_BASE_URL` + regra: token obrigatório em `live`
- **`.env.example`** — documentado
- **`tabs/tab.types.ts` + `tabs/tab.repository.ts`** — novo método `settleTab`
- **`app.ts`** — `paymentService` em `AppDependencies` + `app.use('/api/payments', ...)`
- **`server.ts`** — factory do gateway + instancia `PaymentService` (compartilha `tabsRepository`); loga o provedor ativo
- **`players/player.routes.test.ts`** — mock de `paymentService`

---

## Frontend

### `frontend/src/features/payments/`

```
types.ts                      ← PixCharge, GatewayPayment
api/paymentsApi.ts            ← createPix(tabId), getPaymentStatus(paymentId)
components/PixPayment.tsx      ← Gera PIX, mostra QR/copia-e-cola, faz polling até aprovar
```

### `PixPayment.tsx`
- Ao montar: chama `createPix(tabId)`
- Exibe o **QR Code** (imagem base64) ou, quando ausente (mock), o **copia-e-cola** com botão "Copiar"
- Faz **polling** de `getPaymentStatus` a cada 3s
- Ao aprovar: tela de sucesso (✓) e dispara `onApproved`
- Trata rejeição e cancelamento

### `CheckoutModal.tsx` (atualizado)
- Seleção de método: **PIX** agora abre o fluxo de gateway (`PixPayment`); **Dinheiro/Cartão** seguem como confirmação manual imediata (endpoint `/checkout`)
- Botão dinâmico: "Gerar PIX" vs "Confirmar"

---

## Fluxo de dados (PIX ponta a ponta)

1. `POST /api/payments/pix { tab_id }` → cria pagamento no MP + linha PENDING
2. Frontend renderiza QR/copia-e-cola e faz polling `GET /api/payments/:id`
3. Cliente paga → MP chama `POST /api/payments/webhook` **e/ou** o polling detecta
4. Backend concilia: `gateway_payments` APPROVED + comanda/recargas PAGAS
5. Frontend mostra sucesso e atualiza a comanda

> Webhook e polling são **redundantes por segurança**: o webhook é a via principal; o polling garante confirmação mesmo sem URL pública configurada (ex: desenvolvimento local).

---

## Verificação
- `tsc --noEmit` limpo em backend e frontend
- 6 testes de backend passando

---

## Para ativar o Mercado Pago real
1. Obter o **Access Token** (sandbox ou produção) no painel do Mercado Pago
2. No `.env`: `PAYMENTS_MODE=live`, `MERCADOPAGO_ACCESS_TOKEN=...`, `PUBLIC_BASE_URL=https://...` (túnel para o webhook em dev)
3. Reiniciar o backend — o log confirma `Payment gateway: mercadopago (mode=live)`

## Próximas evoluções possíveis
- Validar a **assinatura do webhook** (header `x-signature`) do Mercado Pago
- Usar o e-mail real do jogador cadastrado como `payer.email`
- Suporte a **Cartão** (Bricks/tokenização) e **Point** (maquininha) reutilizando o mesmo `PaymentGatewayPort`
- Persistir `qr_code`/`expires_at` para reabrir a cobrança sem gerar outra
