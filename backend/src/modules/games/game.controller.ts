import type { NextFunction, Request, Response } from 'express';

import { success } from '../../shared/api.js';
import { parseCreateGame, parseGameId } from './game.schemas.js';
import type { GameServicePort } from './game.service.js';

export class GameController {
  public constructor(private readonly gameService: GameServicePort) {}

  public create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const game = await this.gameService.create(parseCreateGame(request.body));
      response.status(201).json(success(game));
    } catch (error) {
      next(error);
    }
  };

  public start = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const game = await this.gameService.start(parseGameId(request.params.id));
      response.status(200).json(success(game));
    } catch (error) {
      next(error);
    }
  };

  public finish = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const game = await this.gameService.finish(parseGameId(request.params.id));
      response.status(200).json(success(game));
    } catch (error) {
      next(error);
    }
  };

  public getActive = async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const game = await this.gameService.getActive();
      response.status(200).json(success(game));
    } catch (error) {
      next(error);
    }
  };

  public getById = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const game = await this.gameService.getById(parseGameId(request.params.id));
      response.status(200).json(success(game));
    } catch (error) {
      next(error);
    }
  };

  public listByDate = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const date = typeof request.query.date === 'string'
        ? request.query.date
        : new Date().toISOString().slice(0, 10);
      const games = await this.gameService.listByDate(date);
      response.status(200).json(success(games));
    } catch (error) {
      next(error);
    }
  };

  public history = async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const games = await this.gameService.listHistory();
      response.status(200).json(success(games));
    } catch (error) {
      next(error);
    }
  };
}
