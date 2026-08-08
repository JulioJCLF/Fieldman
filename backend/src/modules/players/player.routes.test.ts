import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../../test/harness.js';
import type { Player } from './player.types.js';

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

describe('player routes', () => {
  it('creates a validated player with the standard API envelope', async () => {
    const { app, services } = buildTestApp();
    services.playerService.register.mockResolvedValue(player);

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
    expect(services.playerService.register).toHaveBeenCalledWith(expect.objectContaining({ cpf: '52998224725' }));
  });

  it('returns a player for a valid exact search', async () => {
    const { app, services } = buildTestApp();
    services.playerService.search.mockResolvedValue(player);

    const response = await request(app).get('/api/players/search?registration_number=18');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, data: player });
    expect(services.playerService.search).toHaveBeenCalledWith({ field: 'registration_number', value: 18 });
  });

  it('rejects ambiguous search requests', async () => {
    const { app } = buildTestApp();
    const response = await request(app).get('/api/players/search?cpf=52998224725&phone=11999999999');

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it('returns 404 with the standard envelope for unknown routes', async () => {
    const { app } = buildTestApp();
    const response = await request(app).get('/api/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ success: false, data: null, error: expect.any(String) });
  });
});
