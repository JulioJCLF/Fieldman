import { Router } from 'express';

import { InventoryController } from './inventory.controller.js';
import type { InventoryServicePort } from './inventory.service.js';

/**
 * Rotas montadas em: app.use('/api/inventory', createInventoryRouter(inventoryService))
 * O segmento :channel aceita "snackbar" (Lanchonete) ou "store" (Loja).
 */
export function createInventoryRouter(service: InventoryServicePort): Router {
  const router     = Router();
  const controller = new InventoryController(service);

  // Relatórios (declarados antes de /:id para não colidir)
  router.get('/:channel/reports/summary',        controller.revenueSummary);
  router.get('/:channel/reports/top-products',   controller.topProducts);
  router.get('/:channel/reports/top-categories', controller.topCategories);

  // Vendas
  router.post('/:channel/sales', controller.recordSale);
  router.get('/:channel/sales',  controller.listSales);

  // Produtos
  router.post('/:channel/products',              controller.createProduct);
  router.get('/:channel/products',               controller.listProducts);
  router.get('/:channel/products/:id',           controller.getProduct);
  router.patch('/:channel/products/:id',         controller.updateProduct);
  router.patch('/:channel/products/:id/stock',   controller.adjustStock);

  return router;
}
