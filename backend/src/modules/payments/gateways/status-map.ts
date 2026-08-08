import type { PaymentGwStatus } from '../payment.types.js';

/** Mapeia o status textual do Mercado Pago para o nosso enum interno. */
export function mapMercadoPagoStatus(status: string): PaymentGwStatus {
  switch (status) {
    case 'approved':
      return 'APPROVED';
    case 'rejected':
    case 'cancelled':
      return 'REJECTED';
    case 'refunded':
    case 'charged_back':
      return 'REFUNDED';
    case 'pending':
    case 'in_process':
    case 'authorized':
    default:
      return 'PENDING';
  }
}
