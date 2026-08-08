import { randomUUID } from 'node:crypto';

import type {
  CreatePixInput,
  GatewayPaymentSnapshot,
  GatewayPixResult,
  PaymentGatewayPort,
} from '../payment.types.js';
import { mapMercadoPagoStatus } from './status-map.js';

const MP_API = 'https://api.mercadopago.com/v1/payments';

interface MpPaymentResponse {
  id: number;
  status: string;
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
      ticket_url?: string;
    };
  };
  date_of_expiration?: string;
}

/**
 * Integração real com o Mercado Pago via Checkout API (pagamento PIX).
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/payment-integration
 */
export class MercadoPagoGateway implements PaymentGatewayPort {
  public readonly provider = 'mercadopago';

  public constructor(
    private readonly accessToken: string,
    private readonly notificationUrl?: string,
  ) {}

  public async createPix(input: CreatePixInput): Promise<GatewayPixResult> {
    const body: Record<string, unknown> = {
      transaction_amount: Number(input.amount.toFixed(2)),
      description:        input.description,
      payment_method_id:  'pix',
      external_reference:  input.externalReference,
      payer:              { email: input.payerEmail },
    };
    if (this.notificationUrl) {
      body.notification_url = this.notificationUrl;
    }

    const response = await fetch(MP_API, {
      method: 'POST',
      headers: {
        'Authorization':   `Bearer ${this.accessToken}`,
        'Content-Type':    'application/json',
        'X-Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => null)) as MpPaymentResponse | { message?: string } | null;

    if (!response.ok || !payload || !('id' in payload)) {
      const message = payload && 'message' in payload ? payload.message : 'Falha ao criar cobrança PIX no Mercado Pago.';
      throw new Error(message ?? 'Falha ao criar cobrança PIX no Mercado Pago.');
    }

    const txData = payload.point_of_interaction?.transaction_data;
    return {
      gatewayPaymentId: String(payload.id),
      status:           mapMercadoPagoStatus(payload.status),
      qrCode:           txData?.qr_code ?? '',
      qrCodeBase64:     txData?.qr_code_base64 ?? '',
      ticketUrl:        txData?.ticket_url ?? null,
      expiresAt:        payload.date_of_expiration ?? null,
    };
  }

  public async getPayment(gatewayPaymentId: string): Promise<GatewayPaymentSnapshot> {
    const response = await fetch(`${MP_API}/${gatewayPaymentId}`, {
      headers: { 'Authorization': `Bearer ${this.accessToken}` },
    });

    const payload = (await response.json().catch(() => null)) as MpPaymentResponse | null;

    if (!response.ok || !payload || !('id' in payload)) {
      throw new Error('Falha ao consultar pagamento no Mercado Pago.');
    }

    return {
      gatewayPaymentId: String(payload.id),
      status:           mapMercadoPagoStatus(payload.status),
    };
  }
}
