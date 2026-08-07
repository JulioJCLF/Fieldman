import 'dotenv/config';

import { createApp } from './app.js';
import { loadEnvironment } from './config/env.js';
import { createSupabaseAdminClient } from './lib/supabase.js';
import { SupabasePlayersRepository } from './modules/players/player.repository.js';
import { PlayerService } from './modules/players/player.service.js';

const environment = loadEnvironment();
const repository = new SupabasePlayersRepository(createSupabaseAdminClient(environment));
const app = createApp({
  corsOrigin: environment.CORS_ORIGIN,
  playerService: new PlayerService(repository),
});

const server = app.listen(environment.PORT, () => {
  console.info(`Fieldman API listening on port ${environment.PORT}`);
});

function shutdown(): void {
  server.close(() => process.exit(0));
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
