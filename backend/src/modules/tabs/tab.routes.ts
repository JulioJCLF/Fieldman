import { Router } from 'express';

import { TabController } from './tab.controller.js';
import type { TabServicePort } from './tab.service.js';

/**
 * Rotas aninhadas sob /api/games/:gameId
 * Montadas no app como: app.use('/api/games', createTabsForGameRouter(tabService))
 */
export function createTabsForGameRouter(tabService: TabServicePort): Router {
  const router     = Router({ mergeParams: true });
  const controller = new TabController(tabService);

  router.post('/:gameId/tabs',          controller.checkin);
  router.get('/:gameId/tabs/summary',   controller.getGameSummary);
  router.get('/:gameId/tabs',           controller.listTabs);

  return router;
}

/**
 * Rotas diretas por comanda
 * Montadas no app como: app.use('/api/tabs', createTabsRouter(tabService))
 */
export function createTabsRouter(tabService: TabServicePort): Router {
  const router     = Router();
  const controller = new TabController(tabService);

  router.get('/:tabId',                          controller.getTab);
  router.post('/:tabId/refills',                 controller.addRefill);
  router.patch('/:tabId/refills/:refillId/pay',  controller.markRefillPaid);
  router.post('/:tabId/checkout',                controller.checkout);

  return router;
}
