import { api, ApiError } from '../../../lib/apiClient';
import type { CreateGamePayload, Game, GameHistoryItem } from '../types';

export { ApiError };

export async function getGameHistory(): Promise<GameHistoryItem[]> {
  return api.get<GameHistoryItem[]>('/api/games/history');
}

export async function createGame(payload: CreateGamePayload): Promise<Game> {
  return api.post<Game>('/api/games', payload);
}

export async function startGame(id: string): Promise<Game> {
  return api.patch<Game>(`/api/games/${id}/start`);
}

export async function finishGame(id: string): Promise<Game> {
  return api.patch<Game>(`/api/games/${id}/finish`);
}

export async function getActiveGame(): Promise<Game | null> {
  return api.get<Game | null>('/api/games/active');
}
