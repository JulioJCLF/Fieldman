import { api, ApiError } from '../../../lib/apiClient';
import type {
  CheckoutPayload,
  CreateRefillPayload,
  CreateTabPayload,
  GameTabsSummary,
  GatewayPayment,
  Refill,
  TabWithRefills,
} from '../types';

export { ApiError };

export async function createTab(gameId: string, payload: CreateTabPayload): Promise<TabWithRefills> {
  return api.post<TabWithRefills>(`/api/games/${gameId}/tabs`, payload);
}

export async function listTabs(gameId: string): Promise<TabWithRefills[]> {
  return api.get<TabWithRefills[]>(`/api/games/${gameId}/tabs`);
}

export async function getGameSummary(gameId: string): Promise<GameTabsSummary> {
  return api.get<GameTabsSummary>(`/api/games/${gameId}/tabs/summary`);
}

export async function addRefill(tabId: string, payload: CreateRefillPayload): Promise<Refill> {
  return api.post<Refill>(`/api/tabs/${tabId}/refills`, payload);
}

export async function markRefillPaid(tabId: string, refillId: string): Promise<Refill> {
  return api.patch<Refill>(`/api/tabs/${tabId}/refills/${refillId}/pay`);
}

export async function checkout(tabId: string, payload: CheckoutPayload): Promise<GatewayPayment> {
  return api.post<GatewayPayment>(`/api/tabs/${tabId}/checkout`, payload);
}
