import type { NextFunction, Request, Response } from 'express';

import { success } from '../../shared/api.js';
import { extractWebhookPaymentId, parseCreatePix, parsePaymentId } from './payment.schemas.js';
import type { PaymentServicePort } from './payment.service.js';

export class PaymentController {
  public constructor(private readonly service: PaymentServicePort) {}

  public createPix = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const { tabId } = parseCreatePix(request.body);
      const charge    = await this.service.createPixForTab(tabId);
      response.status(201).json(success(charge));
    } catch (error) {
      next(error);
    }
  };

  public getStatus = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await this.service.getStatus(parsePaymentId(request.params.paymentId));
      response.status(200).json(success(payment));
    } catch (error) {
      next(error);
    }
  };

  /**
   * Webhook do Mercado Pago. Responde 200 rapidamente mesmo em caso de ruído,
   * para o MP não reenfileirar a notificação. Erros são logados, não propagados.
   */
  public webhook = async (request: Request, response: Response): Promise<void> => {
    try {
      const paymentId = extractWebhookPaymentId(request.body, request.query as Record<string, unknown>);
      if (paymentId) {
        await this.service.handleWebhook(paymentId);
      }
    } catch (error) {
      console.error('Erro ao processar webhook de pagamento', error);
    }
    response.status(200).json(success({ received: true }));
  };
}
