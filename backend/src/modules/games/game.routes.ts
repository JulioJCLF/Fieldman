import { Router } from 'express';

import { GameController } from './game.controller.js';
import type { GameServicePort } from './game.service.js';

export function createGameRouter(gameService: GameServicePort): Router {
  const router = Router();
  const controller = new GameController(gameService);

  router.post('/',             controller.create);
  router.get('/active',        controller.getActive);
  router.get('/history',       controller.history);
  router.get('/',              controller.listByDate);
  router.get('/:id',           controller.getById);
  router.patch('/:id/start',   controller.start);
  router.patch('/:id/finish',  controller.finish);

  return router;
}
