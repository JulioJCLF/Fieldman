import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../../test/harness.js';
import type { TabWithRefills } from './tab.types.js';

const GAME_ID = 'b3f1c2d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d';
const TAB_ID  = 'a1a2a3a4-b1b2-4c3c-8d4d-e5e6f7a8b9c0';

const tab: TabWithRefills = {
  id: TAB_ID,
  game_id: GAME_ID,
  player_id: null,
  guest_name: 'Visitante',
  player_name: 'Visitante',
  modality: 'RENTAL',
  entry_fee: 80,
  entry_status: 'PENDING',
  created_at: '2026-08-08T10:00:00.000Z',
  updated_at: '2026-08-08T10:00:00.000Z',
  refills: [],
  payments: [],
};

describe('tab routes', () => {
  it('checks in a guest player', async () => {
    const { app, services } = buildTestApp();
    services.tabService.checkin.mockResolvedValue(tab);

    const response = await request(app).post(`/api/games/${GAME_ID}/tabs`).send({
      guest_name: 'Visitante',
      player_name: 'Visitante',
      modality: 'RENTAL',
      entry_fee: 80,
    });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe(TAB_ID);
    expect(services.tabService.checkin).toHaveBeenCalledWith(expect.objectContaining({ game_id: GAME_ID, modality: 'RENTAL' }));
  });

  it('rejects a check-in without player nor guest', async () => {
    const { app, services } = buildTestApp();
    const response = await request(app).post(`/api/games/${GAME_ID}/tabs`).send({
      player_name: 'Sem Vínculo',
      modality: 'RENTAL',
      entry_fee: 80,
    });

    expect(response.status).toBe(400);
    expect(services.tabService.checkin).not.toHaveBeenCalled();
  });

  it('lists tabs for a game', async () => {
    const { app, services } = buildTestApp();
    services.tabService.listTabs.mockResolvedValue([tab]);

    const response = await request(app).get(`/api/games/${GAME_ID}/tabs`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it('checks out a tab with a payment method', async () => {
    const { app, services } = buildTestApp();
    services.tabService.checkout.mockResolvedValue({ id: 'pay-1', tab_id: TAB_ID, method: 'CASH', amount: 80, status: 'APPROVED', gateway_transaction_id: null, created_at: '2026-08-08T11:00:00.000Z' });

    const response = await request(app).post(`/api/tabs/${TAB_ID}/checkout`).send({ method: 'CASH' });

    expect(response.status).toBe(200);
    expect(services.tabService.checkout).toHaveBeenCalledWith(TAB_ID, 'CASH');
  });

  it('rejects an invalid payment method at checkout', async () => {
    const { app, services } = buildTestApp();
    const response = await request(app).post(`/api/tabs/${TAB_ID}/checkout`).send({ method: 'BITCOIN' });

    expect(response.status).toBe(400);
    expect(services.tabService.checkout).not.toHaveBeenCalled();
  });
});
