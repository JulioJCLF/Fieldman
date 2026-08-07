import cors from 'cors';
import express, { type Express } from 'express';

import { createPlayerRouter } from './modules/players/player.routes.js';
import type { PlayerServicePort } from './modules/players/player.service.js';
import { failure, success } from './shared/api.js';
import { errorHandler } from './shared/error-handler.js';

export interface AppDependencies {
  corsOrigin: string;
  playerService: PlayerServicePort;
}

export function createApp({ corsOrigin, playerService }: AppDependencies): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '32kb' }));

  app.get('/health', (_request, response) => {
    response.status(200).json(success({ status: 'ok' }));
  });

  app.use('/api/players', createPlayerRouter(playerService));

  app.use((_request, response) => {
    response.status(404).json(failure('Rota n\u00e3o encontrada.'));
  });

  app.use(errorHandler);
  return app;
}
