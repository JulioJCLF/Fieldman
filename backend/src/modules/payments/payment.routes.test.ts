import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../../test/harness.js';

const TAB_ID     = 'a1a2a3a4-b1b2-4c3c-8d4d-e5e6f7a8b9c0';
const PAYMENT_ID = 'd1d2d3d4-e1e2-4f3f-8a4a-b5b6c7d8e9f0';

describe('payment routes', () => {
  it('creates a PIX charge for a tab', async () => {
    const { app, services } = buildTestApp();
    services.paymentService.createPixForTab.mockResolvedValue({
      payment_id: PAYMENT_ID, status: 'PENDING', amount: 80,
      qr_code: '00020126MOCK', qr_code_base64: '', ticket_url: null, expires_at: null,
    });

    const response = await request(app).post('/api/payments/pix').send({ tab_id: TAB_ID });

    expect(response.status).toBe(201);
    expect(response.body.data.payment_id).toBe(PAYMENT_ID);
    expect(services.paymentService.createPixForTab).toHaveBeenCalledWith(TAB_ID);
  });

  it('rejects a PIX request without a tab_id', async () => {
    const { app, services } = buildTestApp();
    const response = await request(app).post('/api/payments/pix').send({});

    expect(response.status).toBe(400);
    expect(services.paymentService.createPixForTab).not.toHaveBeenCalled();
  });

  it('returns a payment status', async () => {
    const { app, services } = buildTestApp();
    services.paymentService.getStatus.mockResolvedValue({ id: PAYMENT_ID, tab_id: TAB_ID, gateway_transaction_id: 'mp-1', method: 'PIX', amount: 80, status: 'APPROVED', created_at: '2026-08-08T11:00:00.000Z' });

    const response = await request(app).get(`/api/payments/${PAYMENT_ID}`);

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('APPROVED');
  });

  it('acknowledges a webhook with 200 even for unknown payments', async () => {
    const { app, services } = buildTestApp();
    services.paymentService.handleWebhook.mockResolvedValue(undefined);

    const response = await request(app).post('/api/payments/webhook').send({ type: 'payment', data: { id: '999' } });

    expect(response.status).toBe(200);
    expect(services.paymentService.handleWebhook).toHaveBeenCalledWith('999');
  });

  it('ignores non-payment webhook notifications', async () => {
    const { app, services } = buildTestApp();
    const response = await request(app).post('/api/payments/webhook').send({ type: 'plan', data: { id: '1' } });

    expect(response.status).toBe(200);
    expect(services.paymentService.handleWebhook).not.toHaveBeenCalled();
  });
});
