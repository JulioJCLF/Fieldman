import { api, ApiError } from '../../../lib/apiClient';
import type { GatewayPayment, PixCharge } from '../types';

export { ApiError };

export async function createPix(tabId: string): Promise<PixCharge> {
  return api.post<PixCharge>('/api/payments/pix', { tab_id: tabId });
}

export async function getPaymentStatus(paymentId: string): Promise<GatewayPayment> {
  return api.get<GatewayPayment>(`/api/payments/${paymentId}`);
}
