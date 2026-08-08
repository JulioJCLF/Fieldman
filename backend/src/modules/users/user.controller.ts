import type { NextFunction, Request, Response } from 'express';

import { success } from '../../shared/api.js';
import { parseCreateUser, parseUpdateUser, parseUserId } from './user.schemas.js';
import type { UserServicePort } from './user.service.js';

export class UserController {
  public constructor(private readonly userService: UserServicePort) {}

  public list = async (_request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      response.status(200).json(success(await this.userService.list()));
    } catch (error) {
      next(error);
    }
  };

  public create = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.create(parseCreateUser(request.body));
      response.status(201).json(success(user));
    } catch (error) {
      next(error);
    }
  };

  public update = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.update(parseUserId(request.params.id), parseUpdateUser(request.body));
      response.status(200).json(success(user));
    } catch (error) {
      next(error);
    }
  };

  public remove = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const id = parseUserId(request.params.id);
      await this.userService.remove(id);
      response.status(200).json(success({ id }));
    } catch (error) {
      next(error);
    }
  };
}
