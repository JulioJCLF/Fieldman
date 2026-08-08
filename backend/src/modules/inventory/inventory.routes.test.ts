import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { buildTestApp } from '../../test/harness.js';
import type { Product } from './inventory.types.js';

const product: Product = {
  id: 'c1c2c3c4-d1d2-4e3e-8f4f-a5a6b7c8d9e0',
  channel: 'SNACKBAR',
  name: 'Refrigerante lata',
  category: 'Bebidas',
  cost_price: 3,
  sale_price: 6,
  stock_qty: 24,
  active: true,
  created_at: '2026-08-08T10:00:00.000Z',
  updated_at: '2026-08-08T10:00:00.000Z',
};

describe('inventory routes', () => {
  it('creates a product under the snackbar channel', async () => {
    const { app, services } = buildTestApp();
    services.inventoryService.createProduct.mockResolvedValue(product);

    const response = await request(app).post('/api/inventory/snackbar/products').send({
      name: 'Refrigerante lata',
      category: 'Bebidas',
      cost_price: 3,
      sale_price: 6,
      stock_qty: 24,
    });

    expect(response.status).toBe(201);
    expect(services.inventoryService.createProduct).toHaveBeenCalledWith(expect.objectContaining({ channel: 'SNACKBAR' }));
  });

  it('maps the store slug to the STORE channel', async () => {
    const { app, services } = buildTestApp();
    services.inventoryService.listProducts.mockResolvedValue([]);

    await request(app).get('/api/inventory/store/products');

    expect(services.inventoryService.listProducts).toHaveBeenCalledWith('STORE');
  });

  it('rejects an unknown channel slug', async () => {
    const { app, services } = buildTestApp();
    const response = await request(app).get('/api/inventory/casino/products');

    expect(response.status).toBe(400);
    expect(services.inventoryService.listProducts).not.toHaveBeenCalled();
  });

  it('records a sale', async () => {
    const { app, services } = buildTestApp();
    services.inventoryService.recordSale.mockResolvedValue({ id: 's1', channel: 'SNACKBAR', product_id: product.id, tab_id: null, quantity: 2, unit_price: 6, total_price: 12, sold_at: '2026-08-08T11:00:00.000Z' });

    const response = await request(app).post('/api/inventory/snackbar/sales').send({ product_id: product.id, quantity: 2 });

    expect(response.status).toBe(201);
    expect(services.inventoryService.recordSale).toHaveBeenCalledWith(expect.objectContaining({ channel: 'SNACKBAR', quantity: 2 }));
  });

  it('adjusts stock via delta', async () => {
    const { app, services } = buildTestApp();
    services.inventoryService.adjustStock.mockResolvedValue({ ...product, stock_qty: 34 });

    const response = await request(app).patch(`/api/inventory/snackbar/products/${product.id}/stock`).send({ delta: 10 });

    expect(response.status).toBe(200);
    expect(services.inventoryService.adjustStock).toHaveBeenCalledWith('SNACKBAR', product.id, 10);
  });
});
