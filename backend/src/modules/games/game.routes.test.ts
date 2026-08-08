import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../../test/harness.js';
import type { Game } from './game.types.js';

const game: Game = {
  id: 'b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
  type: 'OPEN',
  game_date: '2026-08-08',
  status: 'IN_PROGRESS',
  notes: null,
  created_at: '2026-08-08T10:00:00.000Z',
  updated_at: '2026-08-08T10:00:00.000Z',
};

describe('game routes', () => {
  it('lists the game history with stats', async () => {
    const { app, services } = buildTestApp();
    const historyItem = {
      ...game,
      status: 'FINISHED' as const,
      player_count: 12,
      equipped_count: 8,
      rental_count: 4,
      entry_revenue: 960,
      refills_revenue: 240,
      total_revenue: 1200,
    };
    services.gameService.listHistory.mockResolvedValue([historyItem]);

    const response = await request(app).get('/api/games/history');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: [historyItem] });
    expect(services.gameService.listHistory).toHaveBeenCalled();
  });

  it('creates a game', async () => {
    const { app, services } = buildTestApp();
    services.gameService.create.mockResolvedValue({ ...game, status: 'SCHEDULED' });

    const response = await request(app).post('/api/games').send({ type: 'OPEN' });

    expect(response.status).toBe(201);
    expect(response.body.data.type).toBe('OPEN');
    expect(services.gameService.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'OPEN' }));
  });

  it('rejects an invalid game type', async () => {
    const { app, services } = buildTestApp();
    const response = await request(app).post('/api/games').send({ type: 'BOGUS' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(services.gameService.create).not.toHaveBeenCalled();
  });

  it('returns the active game or null', async () => {
    const { app, services } = buildTestApp();
    services.gameService.getActive.mockResolvedValue(null);

    const response = await request(app).get('/api/games/active');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: null });
  });

  it('starts a game by id', async () => {
    const { app, services } = buildTestApp();
    services.gameService.start.mockResolvedValue(game);

    const response = await request(app).patch(`/api/games/${game.id}/start`);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('IN_PROGRESS');
    expect(services.gameService.start).toHaveBeenCalledWith(game.id);
  });

  it('rejects a non-uuid game id', async () => {
    const { app } = buildTestApp();
    const response = await request(app).patch('/api/games/not-a-uuid/finish');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
