import { Router } from 'express';

import { PlayerController } from './player.controller.js';
import type { PlayerServicePort } from './player.service.js';

export function createPlayerRouter(playerService: PlayerServicePort): Router {
  const router = Router();
  const controller = new PlayerController(playerService);

  router.post('/', controller.create);
  router.get('/search', controller.search);

  return router;
}
