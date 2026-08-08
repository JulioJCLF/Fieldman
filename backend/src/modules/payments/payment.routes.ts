import { Router } from 'express';

import { PaymentController } from './payment.controller.js';
import type { PaymentServicePort } from './payment.service.js';

/** Montado em: app.use('/api/payments', createPaymentRouter(paymentService)) */
export function createPaymentRouter(service: PaymentServicePort): Router {
  const router     = Router();
  const controller = new PaymentController(service);

  router.post('/pix',            controller.createPix);
  router.post('/webhook',        controller.webhook);
  router.get('/:paymentId',      controller.getStatus);

  return router;
}
