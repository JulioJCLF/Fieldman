import type { NextFunction, Request, Response } from 'express';

import { success } from '../../shared/api.js';
import { parseDateRange, parseMonth, parseYear, parseYears } from './analytics.schemas.js';
import type { AnalyticsServicePort } from './analytics.service.js';

export class AnalyticsController {
  public constructor(private readonly service: AnalyticsServicePort) {}

  public overview = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.service.getOverview(parseDateRange(request.query));
      response.status(200).json(success(report));
    } catch (error) {
      next(error);
    }
  };

  public monthly = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.service.getMonthly(parseYear(request.query.year));
      response.status(200).json(success(report));
    } catch (error) {
      next(error);
    }
  };

  public compareMonths = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.service.compareMonthAcrossYears(
        parseMonth(request.query.month),
        parseYear(request.query.year),
      );
      response.status(200).json(success(report));
    } catch (error) {
      next(error);
    }
  };

  public compareYears = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.service.compareYears(parseYears(request.query.years));
      response.status(200).json(success(report));
    } catch (error) {
      next(error);
    }
  };

  public projection = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const report = await this.service.getProjection(parseYear(request.query.year, new Date().getUTCFullYear() + 1));
      response.status(200).json(success(report));
    } catch (error) {
      next(error);
    }
  };
}
