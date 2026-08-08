import type { Environment } from '../../../config/env.js';
import type { PaymentGatewayPort } from '../payment.types.js';
import { MercadoPagoGateway } from './mercadopago.gateway.js';
import { MockPaymentGateway } from './mock.gateway.js';

/**
 * Seleciona o gateway conforme a configuração. Em 'live' usa o Mercado Pago
 * real; caso contrário (ou sem token), usa o mock que aprova automaticamente.
 */
export function createPaymentGateway(env: Environment): PaymentGatewayPort {
  if (env.PAYMENTS_MODE === 'live' && env.MERCADOPAGO_ACCESS_TOKEN) {
    const notificationUrl = env.PUBLIC_BASE_URL
      ? `${env.PUBLIC_BASE_URL.replace(/\/$/, '')}/api/payments/webhook`
      : undefined;
    return new MercadoPagoGateway(env.MERCADOPAGO_ACCESS_TOKEN, notificationUrl);
  }
  return new MockPaymentGateway();
}
