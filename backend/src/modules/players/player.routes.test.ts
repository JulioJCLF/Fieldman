import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { createApp } from '../../app.js';
import type { Player } from './player.types.js';
import type { PlayerServicePort } from './player.service.js';

const player: Player = {
  id: '500c0e11-4b02-4ebd-8c07-6e14911f7f40',
  registration_number: 18,
  name: 'Ana Oliveira',
  cpf: '52998224725',
  phone: '5511999999999',
  email: 'ana@example.com',
  date_of_birth: '1995-04-12',
  client_type: 'BOTH',
  profile: null,
  terms_accepted: true,
  created_at: '2026-08-04T12:00:00.000Z',
};

function createTestApp(service?: Partial<PlayerServicePort>) {
  const playerService: PlayerServicePort = {
    register: vi.fn().mockResolvedValue(player),
    search: vi.fn().mockResolvedValue(player),
    ...service,
  };

  return { app: createApp({ corsOrigin: 'http://localhost:5173', playerService }), playerService };
}

describe('player routes', () => {
  it('creates a validated player with the standard API envelope', async () => {
    const { app, playerService } = createTestApp();
    const response = await request(app).post('/api/players').send({
      name: 'Ana Oliveira',
      cpf: '529.982.247-25',
      phone: '(11) 99999-9999',
      email: 'ana@example.com',
      date_of_birth: '1995-04-12',
      terms_accepted: true,
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ success: true, data: player });
    expect(playerService.register).toHaveBeenCalledWith(expect.objectContaining({ cpf: '52998224725' }));
  });

  it('returns a player for a valid exact search', async () => {
    const { app, playerService } = createTestApp();
    const response = await request(app).get('/api/players/search?registration_number=18');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: player });
    expect(playerService.search).toHaveBeenCalledWith({ field: 'registration_number', value: 18 });
  });

  it('rejects ambiguous search requests', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/players/search?cpf=52998224725&phone=11999999999');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
