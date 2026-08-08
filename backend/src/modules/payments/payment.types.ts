export const PAYMENT_METHODS     = ['PIX', 'CARD', 'CASH']                          as const;
export const PAYMENT_GW_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'REFUNDED'] as const;

export type PaymentMethod   = (typeof PAYMENT_METHODS)[number];
export type PaymentGwStatus = (typeof PAYMENT_GW_STATUSES)[number];

/** Linha da tabela gateway_payments. */
export interface GatewayPayment {
  id: string;
  tab_id: string;
  gateway_transaction_id: string | null;
  method: PaymentMethod;
  amount: number;
  status: PaymentGwStatus;
  created_at: string;
}

/** Resposta enviada ao frontend ao gerar um PIX. */
export interface PixCharge {
  payment_id: string;      // id do nosso gateway_payments
  status: PaymentGwStatus;
  amount: number;
  qr_code: string;         // copia-e-cola
  qr_code_base64: string;  // imagem PNG em base64 (sem prefixo data:)
  ticket_url: string | null;
  expires_at: string | null;
}

// ---- Port do gateway externo (Mercado Pago ou mock) ----

export interface CreatePixInput {
  amount: number;
  description: string;
  externalReference: string; // id do nosso pagamento
  payerEmail: string;
}

export interface GatewayPixResult {
  gatewayPaymentId: string;      // id do pagamento no Mercado Pago
  status: PaymentGwStatus;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string | null;
  expiresAt: string | null;
}

export interface GatewayPaymentSnapshot {
  gatewayPaymentId: string;
  status: PaymentGwStatus;
}

export interface PaymentGatewayPort {
  /** Nome do provedor ativo, para logs/diagnóstico. */
  readonly provider: string;
  createPix(input: CreatePixInput): Promise<GatewayPixResult>;
  getPayment(gatewayPaymentId: string): Promise<GatewayPaymentSnapshot>;
}

// ---- Repositório ----

export interface CreatePendingPaymentInput {
  tab_id: string;
  amount: number;
  method: PaymentMethod;
  gateway_transaction_id: string;
  status: PaymentGwStatus;
}

export interface PaymentsRepository {
  createPending(input: CreatePendingPaymentInput): Promise<GatewayPayment>;
  findById(id: string): Promise<GatewayPayment | null>;
  findByGatewayTxId(gatewayTxId: string): Promise<GatewayPayment | null>;
  updateStatus(id: string, status: PaymentGwStatus): Promise<GatewayPayment>;
}
