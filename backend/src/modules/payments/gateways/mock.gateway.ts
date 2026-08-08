import { randomUUID } from 'node:crypto';

import type {
  CreatePixInput,
  GatewayPaymentSnapshot,
  GatewayPixResult,
  PaymentGatewayPort,
} from '../payment.types.js';

/** Segundos até o pagamento mock ser considerado aprovado (simula o cliente pagando). */
const AUTO_APPROVE_AFTER_MS = 6000;

/**
 * Gateway simulado — permite exercitar o fluxo PIX de ponta a ponta sem
 * credencial do Mercado Pago. O pagamento é aprovado automaticamente alguns
 * segundos após a criação, imitando a confirmação do banco.
 */
export class MockPaymentGateway implements PaymentGatewayPort {
  public readonly provider = 'mock';
  private readonly created = new Map<string, number>(); // id -> createdAt (ms)

  public createPix(input: CreatePixInput): Promise<GatewayPixResult> {
    const id = `mock-${randomUUID()}`;
    this.created.set(id, Date.now());

    // Código copia-e-cola fictício (não é um EMV/BR Code válido — apenas demonstração).
    const qrCode = `00020126MOCK-PIX-${input.externalReference}-${input.amount.toFixed(2)}5204000053039865802BR6009FIELDMAN`;

    return Promise.resolve({
      gatewayPaymentId: id,
      status:           'PENDING',
      qrCode,
      qrCodeBase64:     '', // sem imagem no mock; o frontend mostra o copia-e-cola
      ticketUrl:        null,
      expiresAt:        new Date(Date.now() + 30 * 60_000).toISOString(),
    });
  }

  public getPayment(gatewayPaymentId: string): Promise<GatewayPaymentSnapshot> {
    const createdAt = this.created.get(gatewayPaymentId);
    const approved  = createdAt !== undefined && Date.now() - createdAt >= AUTO_APPROVE_AFTER_MS;

    return Promise.resolve({
      gatewayPaymentId,
      status: approved ? 'APPROVED' : 'PENDING',
    });
  }
}
