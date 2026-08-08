import { Router } from 'express';

import { UserController } from './user.controller.js';
import type { UserServicePort } from './user.service.js';

/** Montado em: app.use('/api/users', createUserRouter(userService)) */
export function createUserRouter(userService: UserServicePort): Router {
  const router = Router();
  const controller = new UserController(userService);

  router.get('/',        controller.list);
  router.post('/',       controller.create);
  router.patch('/:id',   controller.update);
  router.delete('/:id',  controller.remove);

  return router;
}
