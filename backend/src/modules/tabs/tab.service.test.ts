import { describe, expect, it, vi } from 'vitest';

import type { Game, GamesRepository } from '../games/game.types.js';
import { TabService } from './tab.service.js';
import type { TabWithRefills, TabsRepository } from './tab.types.js';

function makeTab(overrides: Partial<TabWithRefills> = {}): TabWithRefills {
  return {
    id: 't1', game_id: 'g1', player_id: null, guest_name: 'Guest', player_name: 'Guest',
    modality: 'RENTAL', entry_fee: 80, entry_status: 'PENDING',
    created_at: '', updated_at: '', refills: [], payments: [], ...overrides,
  };
}

function fakeTabsRepo(overrides: Partial<TabsRepository> = {}): TabsRepository {
  return {
    createTab: vi.fn(),
    findTabById: vi.fn(),
    listTabsByGame: vi.fn(),
    getGameSummary: vi.fn(),
    addRefill: vi.fn(),
    findRefillById: vi.fn(),
    markRefillPaid: vi.fn(),
    checkout: vi.fn(),
    settleTab: vi.fn(),
    ...overrides,
  };
}

function fakeGamesRepo(status: Game['status']): GamesRepository {
  return {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue({ id: 'g1', type: 'OPEN', game_date: '2026-08-08', status, notes: null, created_at: '', updated_at: '' }),
    findActive: vi.fn(),
    updateStatus: vi.fn(),
    listByDate: vi.fn(),
  };
}

describe('TabService', () => {
  it('rejects check-in when the game is not in progress', async () => {
    const service = new TabService(fakeTabsRepo(), fakeGamesRepo('SCHEDULED'));

    await expect(service.checkin({ game_id: 'g1', player_name: 'X', modality: 'RENTAL', entry_fee: 80 }))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  it('creates a tab when the game is in progress', async () => {
    const tab = makeTab();
    const tabsRepo = fakeTabsRepo({ createTab: vi.fn().mockResolvedValue(tab) });
    const service = new TabService(tabsRepo, fakeGamesRepo('IN_PROGRESS'));

    await expect(service.checkin({ game_id: 'g1', player_name: 'Guest', modality: 'RENTAL', entry_fee: 80 })).resolves.toBe(tab);
  });

  it('computes the checkout total from entry fee plus open refills', async () => {
    const tab = makeTab({
      entry_status: 'PENDING',
      entry_fee: 80,
      refills: [
        { id: 'r1', tab_id: 't1', item_type: 'REFILL', description: 'BBs', quantity: 1, total_price: 25, payment_status: 'OPEN', created_at: '' },
        { id: 'r2', tab_id: 't1', item_type: 'SNACKBAR', description: 'Água', quantity: 1, total_price: 5, payment_status: 'PAID', created_at: '' },
      ],
    });
    const checkout = vi.fn().mockResolvedValue({ id: 'p1', tab_id: 't1', method: 'CASH', amount: 105, status: 'APPROVED', gateway_transaction_id: null, created_at: '' });
    const tabsRepo = fakeTabsRepo({ findTabById: vi.fn().mockResolvedValue(tab), checkout });
    const service = new TabService(tabsRepo, fakeGamesRepo('IN_PROGRESS'));

    await service.checkout('t1', 'CASH');

    // 80 (entrada pendente) + 25 (recarga OPEN); a de 5 já está PAGA e não entra.
    expect(checkout).toHaveBeenCalledWith('t1', 'CASH', 105, ['r1']);
  });

  it('rejects checkout when there is nothing pending', async () => {
    const tab = makeTab({ entry_status: 'PAID', refills: [] });
    const tabsRepo = fakeTabsRepo({ findTabById: vi.fn().mockResolvedValue(tab) });
    const service = new TabService(tabsRepo, fakeGamesRepo('IN_PROGRESS'));

    await expect(service.checkout('t1', 'CASH')).rejects.toMatchObject({ statusCode: 422 });
  });

  it('rejects paying a refill that is already paid', async () => {
    const tabsRepo = fakeTabsRepo({
      findRefillById: vi.fn().mockResolvedValue({ id: 'r1', tab_id: 't1', item_type: 'REFILL', description: 'BBs', quantity: 1, total_price: 25, payment_status: 'PAID', created_at: '' }),
    });
    const service = new TabService(tabsRepo, fakeGamesRepo('IN_PROGRESS'));

    await expect(service.markRefillPaid('t1', 'r1')).rejects.toMatchObject({ statusCode: 422 });
  });
});
