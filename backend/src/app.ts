import cors from 'cors';
import express, { type Express, type RequestHandler } from 'express';

import { createAnalyticsRouter } from './modules/analytics/analytics.routes.js';
import type { AnalyticsServicePort } from './modules/analytics/analytics.service.js';
import { createGameRouter } from './modules/games/game.routes.js';
import type { GameServicePort } from './modules/games/game.service.js';
import { createInventoryRouter } from './modules/inventory/inventory.routes.js';
import type { InventoryServicePort } from './modules/inventory/inventory.service.js';
import { createPaymentRouter } from './modules/payments/payment.routes.js';
import type { PaymentServicePort } from './modules/payments/payment.service.js';
import { createPlayerRouter } from './modules/players/player.routes.js';
import type { PlayerServicePort } from './modules/players/player.service.js';
import { createTabsForGameRouter, createTabsRouter } from './modules/tabs/tab.routes.js';
import type { TabServicePort } from './modules/tabs/tab.service.js';
import { failure, success } from './shared/api.js';
import { errorHandler } from './shared/error-handler.js';

export interface AppDependencies {
  corsOrigin: string;
  /** Middleware que exige um usuário autenticado nas rotas /api (exceto as públicas). */
  authenticate: RequestHandler;
  playerService: PlayerServicePort;
  gameService: GameServicePort;
  tabService: TabServicePort;
  inventoryService: InventoryServicePort;
  analyticsService: AnalyticsServicePort;
  paymentService: PaymentServicePort;
}

export function createApp({ corsOrigin, authenticate, playerService, gameService, tabService, inventoryService, analyticsService, paymentService }: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', (_request, response) => {
    response.status(200).json(success({ status: 'ok' }));
  });

  // Protege todas as rotas /api. As rotas públicas (ex.: auto-cadastro de
  // jogador) são liberadas dentro do próprio middleware.
  app.use('/api', authenticate);

  app.use('/api/players',   createPlayerRouter(playerService));
  app.use('/api/games',     createGameRouter(gameService));
  app.use('/api/games',     createTabsForGameRouter(tabService));
  app.use('/api/tabs',      createTabsRouter(tabService));
  app.use('/api/inventory', createInventoryRouter(inventoryService));
  app.use('/api/analytics', createAnalyticsRouter(analyticsService));
  app.use('/api/payments',  createPaymentRouter(paymentService));

  app.use((_request, response) => {
    response.status(404).json(failure('Rota n\u00e3o encontrada.'));
  });

  app.use(errorHandler);
  return app;
}
