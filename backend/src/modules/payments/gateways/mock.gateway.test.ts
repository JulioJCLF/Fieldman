import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MockPaymentGateway } from './mock.gateway.js';

describe('MockPaymentGateway', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('creates a pending PIX with a copia-e-cola code', async () => {
    const gateway = new MockPaymentGateway();
    const result = await gateway.createPix({ amount: 50, description: 'x', externalReference: 'tab-1', payerEmail: 'a@b.c' });

    expect(result.status).toBe('PENDING');
    expect(result.qrCode).toContain('tab-1');
    expect(result.gatewayPaymentId).toMatch(/^mock-/);
  });

  it('stays pending before the auto-approval window', async () => {
    const gateway = new MockPaymentGateway();
    const { gatewayPaymentId } = await gateway.createPix({ amount: 50, description: 'x', externalReference: 't', payerEmail: 'a@b.c' });

    vi.advanceTimersByTime(3000);
    const snapshot = await gateway.getPayment(gatewayPaymentId);

    expect(snapshot.status).toBe('PENDING');
  });

  it('auto-approves after the configured delay', async () => {
    const gateway = new MockPaymentGateway();
    const { gatewayPaymentId } = await gateway.createPix({ amount: 50, description: 'x', externalReference: 't', payerEmail: 'a@b.c' });

    vi.advanceTimersByTime(7000);
    const snapshot = await gateway.getPayment(gatewayPaymentId);

    expect(snapshot.status).toBe('APPROVED');
  });
});
