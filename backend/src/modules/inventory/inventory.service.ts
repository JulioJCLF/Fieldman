import { HttpError } from '../../shared/errors.js';
import type {
  CreateProductInput,
  DateRange,
  InventoryChannel,
  InventoryRepository,
  Product,
  RecordSaleInput,
  RevenueSummary,
  Sale,
  TopCategory,
  TopProduct,
  UpdateProductInput,
} from './inventory.types.js';

export interface InventoryServicePort {
  createProduct(input: CreateProductInput): Promise<Product>;
  listProducts(channel: InventoryChannel): Promise<Product[]>;
  getProduct(channel: InventoryChannel, id: string): Promise<Product>;
  updateProduct(channel: InventoryChannel, id: string, input: UpdateProductInput): Promise<Product>;
  adjustStock(channel: InventoryChannel, id: string, delta: number): Promise<Product>;
  recordSale(input: RecordSaleInput): Promise<Sale>;
  listSales(channel: InventoryChannel, range: DateRange): Promise<Sale[]>;
  getRevenueSummary(channel: InventoryChannel, range: DateRange): Promise<RevenueSummary>;
  getTopProducts(channel: InventoryChannel, range: DateRange, limit: number): Promise<TopProduct[]>;
  getTopCategories(channel: InventoryChannel, range: DateRange): Promise<TopCategory[]>;
}

export class InventoryService implements InventoryServicePort {
  public constructor(private readonly repo: InventoryRepository) {}

  public createProduct(input: CreateProductInput): Promise<Product> {
    return this.repo.createProduct(input);
  }

  public listProducts(channel: InventoryChannel): Promise<Product[]> {
    return this.repo.listProducts(channel);
  }

  public getProduct(channel: InventoryChannel, id: string): Promise<Product> {
    return this.requireProduct(channel, id);
  }

  public async updateProduct(channel: InventoryChannel, id: string, input: UpdateProductInput): Promise<Product> {
    await this.requireProduct(channel, id);
    return this.repo.updateProduct(channel, id, input);
  }

  public async adjustStock(channel: InventoryChannel, id: string, delta: number): Promise<Product> {
    const product = await this.requireProduct(channel, id);
    const newStock = product.stock_qty + delta;
    if (newStock < 0) {
      throw new HttpError(422, `Estoque insuficiente: disponível ${product.stock_qty}, ajuste solicitado ${delta}.`);
    }
    return this.repo.adjustStock(channel, id, newStock);
  }

  public async recordSale(input: RecordSaleInput): Promise<Sale> {
    const product = await this.requireProduct(input.channel, input.product_id);

    if (!product.active) {
      throw new HttpError(422, 'Este produto está inativo e não pode ser vendido.');
    }
    if (product.stock_qty < input.quantity) {
      throw new HttpError(422, `Estoque insuficiente: disponível ${product.stock_qty}, solicitado ${input.quantity}.`);
    }

    const newStock = product.stock_qty - input.quantity;
    return this.repo.recordSale(input, product.sale_price, newStock);
  }

  public listSales(channel: InventoryChannel, range: DateRange): Promise<Sale[]> {
    return this.repo.listSales(channel, range);
  }

  public getRevenueSummary(channel: InventoryChannel, range: DateRange): Promise<RevenueSummary> {
    return this.repo.getRevenueSummary(channel, range);
  }

  public getTopProducts(channel: InventoryChannel, range: DateRange, limit: number): Promise<TopProduct[]> {
    return this.repo.getTopProducts(channel, range, limit);
  }

  public getTopCategories(channel: InventoryChannel, range: DateRange): Promise<TopCategory[]> {
    return this.repo.getTopCategories(channel, range);
  }

  private async requireProduct(channel: InventoryChannel, id: string): Promise<Product> {
    const product = await this.repo.findProductById(channel, id);
    if (!product) {
      throw new HttpError(404, 'Produto não encontrado.');
    }
    return product;
  }
}
