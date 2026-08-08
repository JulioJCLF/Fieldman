import type { Express, RequestHandler } from 'express';
import { vi } from 'vitest';

import { createApp, type AppDependencies } from '../app.js';
import type { AnalyticsServicePort } from '../modules/analytics/analytics.service.js';
import type { GameServicePort } from '../modules/games/game.service.js';
import type { InventoryServicePort } from '../modules/inventory/inventory.service.js';
import type { PaymentServicePort } from '../modules/payments/payment.service.js';
import type { PlayerServicePort } from '../modules/players/player.service.js';
import type { TabServicePort } from '../modules/tabs/tab.service.js';
import type { UserServicePort } from '../modules/users/user.service.js';

/** Cada serviço vira um objeto de mocks vi.fn() com a mesma forma do port. */
type Mocked<T> = { [K in keyof T]: ReturnType<typeof vi.fn> };

export interface TestServices {
  playerService: Mocked<PlayerServicePort>;
  gameService: Mocked<GameServicePort>;
  tabService: Mocked<TabServicePort>;
  inventoryService: Mocked<InventoryServicePort>;
  analyticsService: Mocked<AnalyticsServicePort>;
  paymentService: Mocked<PaymentServicePort>;
  userService: Mocked<UserServicePort>;
}

function mockFromKeys<T extends object>(keys: (keyof T)[]): Mocked<T> {
  return keys.reduce((acc, key) => {
    acc[key] = vi.fn();
    return acc;
  }, {} as Mocked<T>);
}

/**
 * Constrói uma instância do app Express com todos os serviços mockados.
 * Os testes configuram o comportamento via `services.<serviço>.<método>.mockResolvedValue(...)`.
 */
export function buildTestApp(): { app: Express; services: TestServices } {
  const services: TestServices = {
    playerService:    mockFromKeys(['register', 'search']),
    gameService:      mockFromKeys(['create', 'start', 'finish', 'getActive', 'getById', 'listByDate', 'listHistory']),
    tabService:       mockFromKeys(['checkin', 'listTabs', 'getGameSummary', 'getTab', 'addRefill', 'markRefillPaid', 'checkout']),
    inventoryService: mockFromKeys(['createProduct', 'listProducts', 'getProduct', 'updateProduct', 'adjustStock', 'recordSale', 'listSales', 'getRevenueSummary', 'getTopProducts', 'getTopCategories']),
    analyticsService: mockFromKeys(['getOverview', 'getMonthly', 'compareMonthAcrossYears', 'compareYears', 'getProjection']),
    paymentService:   mockFromKeys(['createPixForTab', 'getStatus', 'handleWebhook']),
    userService:      mockFromKeys(['list', 'create', 'update', 'remove']),
  };

  const app = createApp({
    corsOrigin: 'http://localhost:5173',
    // Nos testes de rota a autenticação é um no-op; o middleware real tem
    // cobertura própria em auth.middleware.test.ts.
    authenticate: ((_request, _response, next) => next()) as RequestHandler,
    ...services,
  } as unknown as AppDependencies);

  return { app, services };
}
