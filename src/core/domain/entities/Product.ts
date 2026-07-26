import { ValidationError, BusinessRuleError } from '../errors';
import { Money, Barcode, TaxRate } from '../valueObjects';
import { createDomainEvent, DomainEventPublisher } from '../events';

export interface ProductProps {
  id: string;
  companyId?: string;
  branchId?: string;
  name: string;
  barcode: Barcode;
  price: Money;
  purchasePrice: Money;
  stock: number;
  minStock: number;
  category: string;
  unit: string;
  taxRate: TaxRate;
  isService?: boolean;
  image?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Product {
  public readonly id: string;
  public readonly companyId?: string;
  public readonly branchId?: string;
  private _name: string;
  public readonly barcode: Barcode;
  private _price: Money;
  private _purchasePrice: Money;
  private _stock: number;
  private _minStock: number;
  private _category: string;
  private _unit: string;
  public readonly taxRate: TaxRate;
  public readonly isService: boolean;
  public readonly image?: string;
  public readonly description?: string;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: ProductProps) {
    Product.validate(props);
    this.id = props.id;
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this._name = props.name.trim();
    this.barcode = props.barcode;
    this._price = props.price;
    this._purchasePrice = props.purchasePrice;
    this._stock = props.stock;
    this._minStock = props.minStock;
    this._category = props.category.trim();
    this._unit = props.unit.trim();
    this.taxRate = props.taxRate;
    this.isService = props.isService ?? false;
    this.image = props.image;
    this.description = props.description;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  public get name(): string { return this._name; }
  public get price(): Money { return this._price; }
  public get purchasePrice(): Money { return this._purchasePrice; }
  public get stock(): number { return this._stock; }
  public get minStock(): number { return this._minStock; }
  public get category(): string { return this._category; }
  public get unit(): string { return this._unit; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Validation
  public static validate(props: ProductProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('Product ID is required');
    if (!props.name || !props.name.trim()) errors.push('Product name is required');
    if (props.stock < 0 && !props.isService) errors.push('Stock cannot be negative for physical products');
    if (props.minStock < 0) errors.push('Minimum stock threshold cannot be negative');
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Business Rules
  public isLowStock(): boolean {
    if (this.isService || this._stock === 999) return false;
    return this._stock <= this._minStock;
  }

  public calculateProfitMargin(): number {
    if (this._price.amount === 0) return 0;
    const profit = this._price.amount - this._purchasePrice.amount;
    return Math.round((profit / this._price.amount) * 10000) / 100;
  }

  public adjustStock(quantityChange: number, reason: string): void {
    if (this.isService) return; // services have infinite/untracked stock

    const newStock = this._stock + quantityChange;
    if (newStock < 0) {
      throw new BusinessRuleError(`Insufficient stock for product ${this._name}. Available: ${this._stock}, Requested reduction: ${Math.abs(quantityChange)}`, 'INSUFFICIENT_STOCK');
    }

    const previousStock = this._stock;
    this._stock = newStock;
    this._updatedAt = new Date();

    DomainEventPublisher.getInstance().publish(createDomainEvent('StockAdjusted', this.id, {
      previousStock,
      newStock: this._stock,
      quantityChange,
      reason
    }));

    if (this.isLowStock()) {
      DomainEventPublisher.getInstance().publish(createDomainEvent('LowStockAlert', this.id, {
        stock: this._stock,
        minStock: this._minStock
      }));
    }
  }

  public updatePrices(price: Money, purchasePrice?: Money): void {
    this._price = price;
    if (purchasePrice) {
      this._purchasePrice = purchasePrice;
    }
    this._updatedAt = new Date();
    DomainEventPublisher.getInstance().publish(createDomainEvent('ProductPriceUpdated', this.id, {
      price: price.amount,
      purchasePrice: this._purchasePrice.amount
    }));
  }
}
