import type { NextFunction, Request, Response } from 'express';

import { success } from '../../shared/api.js';
import { parseCreatePlayer, parsePlayerSearchQuery } from './player.schemas.js';
import type { PlayerServicePort } from './player.service.js';

export class PlayerController {
  public constructor(private readonly playerService: PlayerServicePort) {}

  public create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const player = await this.playerService.register(parseCreatePlayer(request.body));
      response.status(201).json(success(player));
    } catch (error) {
      next(error);
    }
  };

  public search = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const player = await this.playerService.search(parsePlayerSearchQuery(request.query));
      response.status(200).json(success(player));
    } catch (error) {
      next(error);
    }
  };
}
