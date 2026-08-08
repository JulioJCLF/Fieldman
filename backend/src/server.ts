import 'dotenv/config';

import { createApp } from './app.js';
import { loadEnvironment } from './config/env.js';
import { createSupabaseAdminClient } from './lib/supabase.js';
import { createAuthMiddleware } from './modules/auth/auth.middleware.js';
import { SupabaseAnalyticsRepository } from './modules/analytics/analytics.repository.js';
import { AnalyticsService } from './modules/analytics/analytics.service.js';
import { SupabaseGamesRepository } from './modules/games/game.repository.js';
import { GameService } from './modules/games/game.service.js';
import { SupabaseInventoryRepository } from './modules/inventory/inventory.repository.js';
import { InventoryService } from './modules/inventory/inventory.service.js';
import { createPaymentGateway } from './modules/payments/gateways/index.js';
import { SupabasePaymentsRepository } from './modules/payments/payment.repository.js';
import { PaymentService } from './modules/payments/payment.service.js';
import { SupabasePlayersRepository } from './modules/players/player.repository.js';
import { PlayerService } from './modules/players/player.service.js';
import { SupabaseTabsRepository } from './modules/tabs/tab.repository.js';
import { TabService } from './modules/tabs/tab.service.js';

const environment      = loadEnvironment();
const supabase         = createSupabaseAdminClient(environment);
const gamesRepository  = new SupabaseGamesRepository(supabase);
const tabsRepository   = new SupabaseTabsRepository(supabase);
const paymentGateway   = createPaymentGateway(environment);

console.info(`Payment gateway: ${paymentGateway.provider} (mode=${environment.PAYMENTS_MODE})`);

const app = createApp({
  corsOrigin:       environment.CORS_ORIGIN,
  authenticate:     createAuthMiddleware(supabase),
  playerService:    new PlayerService(new SupabasePlayersRepository(supabase)),
  gameService:      new GameService(gamesRepository),
  tabService:       new TabService(tabsRepository, gamesRepository),
  inventoryService: new InventoryService(new SupabaseInventoryRepository(supabase)),
  analyticsService: new AnalyticsService(new SupabaseAnalyticsRepository(supabase)),
  paymentService:   new PaymentService(new SupabasePaymentsRepository(supabase), paymentGateway, tabsRepository),
});

const server = app.listen(environment.PORT, () => {
  console.info(`Fieldman API listening on port ${environment.PORT}`);
});

function shutdown(): void {
  server.close(() => process.exit(0));
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
