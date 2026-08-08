import { describe, expect, it, vi } from 'vitest';

import type { TabWithRefills, TabsRepository } from '../tabs/tab.types.js';
import { PaymentService } from './payment.service.js';
import type { GatewayPayment, PaymentGatewayPort, PaymentsRepository } from './payment.types.js';

const TAB_ID = 't1';

function makeTab(overrides: Partial<TabWithRefills> = {}): TabWithRefills {
  return {
    id: TAB_ID, game_id: 'g1', player_id: null, guest_name: 'Guest', player_name: 'Guest',
    modality: 'RENTAL', entry_fee: 80, entry_status: 'PENDING',
    created_at: '', updated_at: '', refills: [], payments: [], ...overrides,
  };
}

function makePayment(overrides: Partial<GatewayPayment> = {}): GatewayPayment {
  return {
    id: 'pay1', tab_id: TAB_ID, gateway_transaction_id: 'mp-1',
    method: 'PIX', amount: 80, status: 'PENDING', created_at: '', ...overrides,
  };
}

function fakePaymentsRepo(overrides: Partial<PaymentsRepository> = {}): PaymentsRepository {
  return {
    createPending: vi.fn(),
    findById: vi.fn(),
    findByGatewayTxId: vi.fn(),
    updateStatus: vi.fn().mockImplementation((id, status) => Promise.resolve(makePayment({ id, status }))),
    ...overrides,
  };
}

function fakeTabsRepo(overrides: Partial<TabsRepository> = {}): TabsRepository {
  return {
    createTab: vi.fn(), findTabById: vi.fn(), listTabsByGame: vi.fn(), getGameSummary: vi.fn(),
    addRefill: vi.fn(), findRefillById: vi.fn(), markRefillPaid: vi.fn(), checkout: vi.fn(),
    settleTab: vi.fn().mockResolvedValue(undefined), ...overrides,
  };
}

function fakeGateway(overrides: Partial<PaymentGatewayPort> = {}): PaymentGatewayPort {
  return {
    provider: 'test',
    createPix: vi.fn().mockResolvedValue({ gatewayPaymentId: 'mp-1', status: 'PENDING', qrCode: 'QR', qrCodeBase64: '', ticketUrl: null, expiresAt: null }),
    getPayment: vi.fn(),
    ...overrides,
  };
}

describe('PaymentService · createPixForTab', () => {
  it('creates a pending PIX for the tab total', async () => {
    const tab = makeTab({
      entry_fee: 80, entry_status: 'PENDING',
      refills: [{ id: 'r1', tab_id: TAB_ID, item_type: 'REFILL', description: 'BBs', quantity: 1, total_price: 25, payment_status: 'OPEN', created_at: '' }],
    });
    const repo = fakePaymentsRepo({ createPending: vi.fn().mockResolvedValue(makePayment({ amount: 105 })) });
    const gateway = fakeGateway();
    const service = new PaymentService(repo, gateway, fakeTabsRepo({ findTabById: vi.fn().mockResolvedValue(tab) }));

    const charge = await service.createPixForTab(TAB_ID);

    expect(gateway.createPix).toHaveBeenCalledWith(expect.objectContaining({ amount: 105 }));
    expect(repo.createPending).toHaveBeenCalledWith(expect.objectContaining({ tab_id: TAB_ID, amount: 105, method: 'PIX', status: 'PENDING' }));
    expect(charge.qr_code).toBe('QR');
  });

  it('rejects when the tab has nothing pending', async () => {
    const tab = makeTab({ entry_status: 'PAID', refills: [] });
    const service = new PaymentService(fakePaymentsRepo(), fakeGateway(), fakeTabsRepo({ findTabById: vi.fn().mockResolvedValue(tab) }));

    await expect(service.createPixForTab(TAB_ID)).rejects.toMatchObject({ statusCode: 422 });
  });

  it('throws 404 for an unknown tab', async () => {
    const service = new PaymentService(fakePaymentsRepo(), fakeGateway(), fakeTabsRepo({ findTabById: vi.fn().mockResolvedValue(null) }));

    await expect(service.createPixForTab('missing')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('PaymentService · reconciliation', () => {
  it('settles the tab when polling finds the payment approved', async () => {
    const tab = makeTab({ refills: [{ id: 'r1', tab_id: TAB_ID, item_type: 'REFILL', description: 'BBs', quantity: 1, total_price: 25, payment_status: 'OPEN', created_at: '' }] });
    const repo = fakePaymentsRepo({ findById: vi.fn().mockResolvedValue(makePayment({ status: 'PENDING' })) });
    const tabsRepo = fakeTabsRepo({ findTabById: vi.fn().mockResolvedValue(tab) });
    const gateway = fakeGateway({ getPayment: vi.fn().mockResolvedValue({ gatewayPaymentId: 'mp-1', status: 'APPROVED' }) });
    const service = new PaymentService(repo, gateway, tabsRepo);

    const result = await service.getStatus('pay1');

    expect(tabsRepo.settleTab).toHaveBeenCalledWith(TAB_ID, ['r1']);
    expect(repo.updateStatus).toHaveBeenCalledWith('pay1', 'APPROVED');
    expect(result.status).toBe('APPROVED');
  });

  it('does not re-query the gateway once already approved', async () => {
    const repo = fakePaymentsRepo({ findById: vi.fn().mockResolvedValue(makePayment({ status: 'APPROVED' })) });
    const gateway = fakeGateway({ getPayment: vi.fn() });
    const service = new PaymentService(repo, gateway, fakeTabsRepo());

    await service.getStatus('pay1');

    expect(gateway.getPayment).not.toHaveBeenCalled();
  });

  it('handles an approved webhook by settling the tab', async () => {
    const tab = makeTab({ refills: [] });
    const repo = fakePaymentsRepo({ findByGatewayTxId: vi.fn().mockResolvedValue(makePayment({ status: 'PENDING' })) });
    const tabsRepo = fakeTabsRepo({ findTabById: vi.fn().mockResolvedValue(tab) });
    const gateway = fakeGateway({ getPayment: vi.fn().mockResolvedValue({ gatewayPaymentId: 'mp-1', status: 'APPROVED' }) });
    const service = new PaymentService(repo, gateway, tabsRepo);

    await service.handleWebhook('mp-1');

    expect(tabsRepo.settleTab).toHaveBeenCalledWith(TAB_ID, []);
    expect(repo.updateStatus).toHaveBeenCalledWith('pay1', 'APPROVED');
  });

  it('ignores webhooks for unknown payments', async () => {
    const repo = fakePaymentsRepo({ findByGatewayTxId: vi.fn().mockResolvedValue(null) });
    const tabsRepo = fakeTabsRepo();
    const service = new PaymentService(repo, fakeGateway(), tabsRepo);

    await service.handleWebhook('unknown');

    expect(tabsRepo.settleTab).not.toHaveBeenCalled();
  });
});
