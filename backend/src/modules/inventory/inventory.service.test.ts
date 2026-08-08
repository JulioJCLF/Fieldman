import { describe, expect, it, vi } from 'vitest';

import { InventoryService } from './inventory.service.js';
import type { InventoryRepository, Product } from './inventory.types.js';

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1', channel: 'SNACKBAR', name: 'Refri', category: 'Bebidas',
    cost_price: 3, sale_price: 6, stock_qty: 10, active: true,
    created_at: '', updated_at: '', ...overrides,
  };
}

function fakeRepo(overrides: Partial<InventoryRepository> = {}): InventoryRepository {
  return {
    createProduct: vi.fn(),
    listProducts: vi.fn(),
    findProductById: vi.fn(),
    updateProduct: vi.fn(),
    adjustStock: vi.fn(),
    recordSale: vi.fn(),
    listSales: vi.fn(),
    getRevenueSummary: vi.fn(),
    getTopProducts: vi.fn(),
    getTopCategories: vi.fn(),
    ...overrides,
  };
}

describe('InventoryService', () => {
  it('rejects a sale over the available stock', async () => {
    const repo = fakeRepo({ findProductById: vi.fn().mockResolvedValue(makeProduct({ stock_qty: 1 })) });
    const service = new InventoryService(repo);

    await expect(service.recordSale({ channel: 'SNACKBAR', product_id: 'p1', quantity: 5 }))
      .rejects.toMatchObject({ statusCode: 422 });
    expect(repo.recordSale).not.toHaveBeenCalled();
  });

  it('rejects selling an inactive product', async () => {
    const repo = fakeRepo({ findProductById: vi.fn().mockResolvedValue(makeProduct({ active: false })) });
    const service = new InventoryService(repo);

    await expect(service.recordSale({ channel: 'SNACKBAR', product_id: 'p1', quantity: 1 }))
      .rejects.toMatchObject({ statusCode: 422 });
  });

  it('records a sale at the product price and decrements stock', async () => {
    const recordSale = vi.fn().mockResolvedValue({ id: 's1', channel: 'SNACKBAR', product_id: 'p1', tab_id: null, quantity: 2, unit_price: 6, total_price: 12, sold_at: '' });
    const repo = fakeRepo({ findProductById: vi.fn().mockResolvedValue(makeProduct({ stock_qty: 10, sale_price: 6 })), recordSale });
    const service = new InventoryService(repo);

    await service.recordSale({ channel: 'SNACKBAR', product_id: 'p1', quantity: 2 });

    expect(recordSale).toHaveBeenCalledWith(expect.objectContaining({ quantity: 2 }), 6, 8);
  });

  it('blocks a stock adjustment that would go negative', async () => {
    const repo = fakeRepo({ findProductById: vi.fn().mockResolvedValue(makeProduct({ stock_qty: 3 })) });
    const service = new InventoryService(repo);

    await expect(service.adjustStock('SNACKBAR', 'p1', -5)).rejects.toMatchObject({ statusCode: 422 });
  });

  it('applies a valid stock adjustment as an absolute new total', async () => {
    const adjustStock = vi.fn().mockResolvedValue(makeProduct({ stock_qty: 13 }));
    const repo = fakeRepo({ findProductById: vi.fn().mockResolvedValue(makeProduct({ stock_qty: 3 })), adjustStock });
    const service = new InventoryService(repo);

    await service.adjustStock('SNACKBAR', 'p1', 10);

    expect(adjustStock).toHaveBeenCalledWith('SNACKBAR', 'p1', 13);
  });

  it('throws 404 for an unknown product', async () => {
    const repo = fakeRepo({ findProductById: vi.fn().mockResolvedValue(null) });
    const service = new InventoryService(repo);

    await expect(service.getProduct('SNACKBAR', 'nope')).rejects.toMatchObject({ statusCode: 404 });
  });
});
