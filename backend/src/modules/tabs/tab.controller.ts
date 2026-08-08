import type { NextFunction, Request, Response } from 'express';

import { success } from '../../shared/api.js';
import { parseCheckoutMethod, parseCreateRefill, parseCreateTab, parseGameId, parseRefillId, parseTabId } from './tab.schemas.js';
import type { TabServicePort } from './tab.service.js';

export class TabController {
  public constructor(private readonly tabService: TabServicePort) {}

  public checkin = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const gameId = parseGameId(request.params.gameId);
      const tab    = await this.tabService.checkin(parseCreateTab(request.body, gameId));
      response.status(201).json(success(tab));
    } catch (error) {
      next(error);
    }
  };

  public listTabs = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const tabs = await this.tabService.listTabs(parseGameId(request.params.gameId));
      response.status(200).json(success(tabs));
    } catch (error) {
      next(error);
    }
  };

  public getGameSummary = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await this.tabService.getGameSummary(parseGameId(request.params.gameId));
      response.status(200).json(success(summary));
    } catch (error) {
      next(error);
    }
  };

  public getTab = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const tab = await this.tabService.getTab(parseTabId(request.params.tabId));
      response.status(200).json(success(tab));
    } catch (error) {
      next(error);
    }
  };

  public addRefill = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const tabId  = parseTabId(request.params.tabId);
      const input  = parseCreateRefill(request.body, tabId);
      const refill = await this.tabService.addRefill(tabId, input);
      response.status(201).json(success(refill));
    } catch (error) {
      next(error);
    }
  };

  public markRefillPaid = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const refill = await this.tabService.markRefillPaid(
        parseTabId(request.params.tabId),
        parseRefillId(request.params.refillId),
      );
      response.status(200).json(success(refill));
    } catch (error) {
      next(error);
    }
  };

  public checkout = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const payment = await this.tabService.checkout(
        parseTabId(request.params.tabId),
        parseCheckoutMethod(request.body),
      );
      response.status(200).json(success(payment));
    } catch (error) {
      next(error);
    }
  };
}
