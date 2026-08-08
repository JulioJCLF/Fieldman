# Changelog: Payments Module (Mercado Pago · PIX)

## [2026-08-08]
- **IMPL:** Módulo `payments` — integração de gateway com foco em **PIX via Mercado Pago** (QR Code na tela).
- **Fluxo:** Gerar PIX → QR/copia-e-cola na recepção → cliente paga pelo celular → webhook + polling → conciliação automática da comanda (entrada + recargas em aberto marcadas como PAGAS).
- **Modo mock:** `PAYMENTS_MODE=mock` (default) exercita o fluxo inteiro sem credencial — aprova automaticamente após ~6s. Troca para `live` + `MERCADOPAGO_ACCESS_TOKEN` sem mudar código.
- **Arquitetura:** `PaymentGatewayPort` (padrão Adapter) com implementações `MercadoPagoGateway` (fetch real) e `MockPaymentGateway`. Factory por env em `gateways/index.ts`.
- **Banco:** Reutiliza `gateway_payments` (nenhuma migration nova). Novo método `TabsRepository.settleTab` separa "registrar pagamento" de "liquidar comanda".
- **Backend:** `payment.types`, `payment.schemas` (+ extração de id no webhook), `payment.repository`, `payment.service`, `payment.controller`, `payment.routes`. Env: `PAYMENTS_MODE`, `MERCADOPAGO_ACCESS_TOKEN`, `PUBLIC_BASE_URL`. Registrado em `app.ts`/`server.ts`.
- **Endpoints:** `POST /api/payments/pix`, `GET /api/payments/:id` (polling), `POST /api/payments/webhook`.
- **Frontend:** `features/payments` (`types`, `api/paymentsApi`, `PixPayment`). `CheckoutModal` atualizado: PIX abre o fluxo de gateway; Dinheiro/Cartão seguem confirmação manual.
- **Verificação:** `tsc --noEmit` limpo em backend e frontend; 6 testes de backend passando.
- **Docs:** `docs/payments_module_structure.md` criado.
- **Status:** Completo (PIX). Cartão/Point e validação de assinatura do webhook ficam como evolução futura.
