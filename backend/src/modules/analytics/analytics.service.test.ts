import { describe, expect, it, vi } from 'vitest';

import { AnalyticsService } from './analytics.service.js';
import type {
  AnalyticsRepository,
  EntryRow,
  GameRow,
  RefillRow,
  SaleRow,
} from './analytics.types.js';

function fakeRepo(data: {
  entries?: EntryRow[];
  refills?: RefillRow[];
  sales?: SaleRow[];
  games?: GameRow[];
}): AnalyticsRepository {
  return {
    getEntries: vi.fn().mockResolvedValue(data.entries ?? []),
    getRefills: vi.fn().mockResolvedValue(data.refills ?? []),
    getSales:   vi.fn().mockResolvedValue(data.sales ?? []),
    getGames:   vi.fn().mockResolvedValue(data.games ?? []),
  };
}

describe('AnalyticsService · overview', () => {
  it('aggregates revenue across sources without double counting and counts check-ins', async () => {
    const service = new AnalyticsService(fakeRepo({
      entries: [
        { at: '2026-08-01T10:00:00Z', modality: 'EQUIPPED', amount: 100, paid: true },
        { at: '2026-08-01T10:00:00Z', modality: 'RENTAL',   amount: 80,  paid: true },
        { at: '2026-08-01T10:00:00Z', modality: 'RENTAL',   amount: 80,  paid: false }, // não pago → não soma
      ],
      refills: [
        { at: '2026-08-01T11:00:00Z', item_type: 'REFILL',   amount: 25, paid: true },
        { at: '2026-08-01T11:00:00Z', item_type: 'SNACKBAR', amount: 5,  paid: true },
      ],
      sales: [
        { at: '2026-08-01T12:00:00Z', channel: 'SNACKBAR', amount: 10 },
        { at: '2026-08-01T12:00:00Z', channel: 'STORE',    amount: 40 },
      ],
      games: [{ at: '2026-08-01T00:00:00Z', type: 'OPEN' }],
    }));

    const report = await service.getOverview({ from: '2026-08-01T00:00:00Z', to: '2026-08-31T23:59:59Z' });

    expect(report.revenue.entry_equipped).toBe(100);
    expect(report.revenue.entry_rental).toBe(80);
    expect(report.revenue.refills).toBe(25);
    expect(report.revenue.snackbar).toBe(15); // 5 (refill) + 10 (venda)
    expect(report.revenue.store).toBe(40);
    expect(report.revenue.total).toBe(260);

    expect(report.counts).toEqual({ equipped: 1, rental: 2, refills: 1, games: 1 });
  });
});

describe('AnalyticsService · projection', () => {
  it('reports insufficient data with fewer than 3 months', async () => {
    const service = new AnalyticsService(fakeRepo({
      sales: [
        { at: '2025-01-15T12:00:00Z', channel: 'STORE', amount: 100 },
        { at: '2025-02-15T12:00:00Z', channel: 'STORE', amount: 200 },
      ],
    }));

    const report = await service.getProjection(2026);

    expect(report.sufficient_data).toBe(false);
    expect(report.based_on_months).toBe(2);
    expect(report.months).toHaveLength(0);
  });

  it('projects 12 non-negative months with a growing trend from an increasing series', async () => {
    const sales: SaleRow[] = Array.from({ length: 12 }, (_, i) => ({
      at: `2025-${String(i + 1).padStart(2, '0')}-15T12:00:00Z`,
      channel: 'STORE' as const,
      amount: (i + 1) * 100,
    }));
    const service = new AnalyticsService(fakeRepo({ sales }));

    const report = await service.getProjection(2026);

    expect(report.sufficient_data).toBe(true);
    expect(report.based_on_months).toBe(12);
    expect(report.months).toHaveLength(12);
    expect(report.months.every((m) => m.projected_revenue >= 0)).toBe(true);
    // Tendência crescente: dezembro projetado > janeiro projetado.
    expect(report.months[11]!.projected_revenue).toBeGreaterThan(report.months[0]!.projected_revenue);
  });
});
