import { Router } from 'express';

import { AnalyticsController } from './analytics.controller.js';
import type { AnalyticsServicePort } from './analytics.service.js';

/** Montado em: app.use('/api/analytics', createAnalyticsRouter(analyticsService)) */
export function createAnalyticsRouter(service: AnalyticsServicePort): Router {
  const router     = Router();
  const controller = new AnalyticsController(service);

  router.get('/overview',        controller.overview);
  router.get('/monthly',         controller.monthly);
  router.get('/compare-months',  controller.compareMonths);
  router.get('/compare-years',   controller.compareYears);
  router.get('/projection',      controller.projection);

  return router;
}
