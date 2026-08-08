import type { NextFunction, Request, Response } from 'express';

import { success } from '../../shared/api.js';
import {
  parseChannel,
  parseCreateProduct,
  parseDateRange,
  parseLimit,
  parseProductId,
  parseRecordSale,
  parseStockDelta,
  parseUpdateProduct,
} from './inventory.schemas.js';
import type { InventoryServicePort } from './inventory.service.js';

export class InventoryController {
  public constructor(private readonly service: InventoryServicePort) {}

  public createProduct = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const channel = parseChannel(request.params.channel);
      const product = await this.service.createProduct(parseCreateProduct(request.body, channel));
      response.status(201).json(success(product));
    } catch (error) {
      next(error);
    }
  };

  public listProducts = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const channel  = parseChannel(request.params.channel);
      const products = await this.service.listProducts(channel);
      response.status(200).json(success(products));
    } catch (error) {
      next(error);
    }
  };

  public getProduct = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const channel = parseChannel(request.params.channel);
      const product = await this.service.getProduct(channel, parseProductId(request.params.id));
      response.status(200).json(success(product));
    } catch (error) {
      next(error);
    }
  };

  public updateProduct = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const channel = parseChannel(request.params.channel);
      const product = await this.service.updateProduct(channel, parseProductId(request.params.id), parseUpdateProduct(request.body));
      response.status(200).json(success(product));
    } catch (error) {
      next(error);
    }
  };

  public adjustStock = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const channel = parseChannel(request.params.channel);
      const product = await this.service.adjustStock(channel, parseProductId(request.params.id), parseStockDelta(request.body));
      response.status(200).json(success(product));
    } catch (error) {
      next(error);
    }
  };

  public recordSale = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const channel = parseChannel(request.params.channel);
      const sale    = await this.service.recordSale(parseRecordSale(request.body, channel));
      response.status(201).json(success(sale));
    } catch (error) {
      next(error);
    }
  };

  public listSales = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const channel = parseChannel(request.params.channel);
      const sales   = await this.service.listSales(channel, parseDateRange(request.query));
      response.status(200).json(success(sales));
    } catch (error) {
      next(error);
    }
  };

  public revenueSummary = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const channel = parseChannel(request.params.channel);
      const summary = await this.service.getRevenueSummary(channel, parseDateRange(request.query));
      response.status(200).json(success(summary));
    } catch (error) {
      next(error);
    }
  };

  public topProducts = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const channel = parseChannel(request.params.channel);
      const top     = await this.service.getTopProducts(channel, parseDateRange(request.query), parseLimit(request.query.limit));
      response.status(200).json(success(top));
    } catch (error) {
      next(error);
    }
  };

  public topCategories = async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    try {
      const channel = parseChannel(request.params.channel);
      const top     = await this.service.getTopCategories(channel, parseDateRange(request.query));
      response.status(200).json(success(top));
    } catch (error) {
      next(error);
    }
  };
}
