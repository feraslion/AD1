import { ValidationError, BusinessRuleError } from '../errors';
import { Money } from '../valueObjects';
import { createDomainEvent, DomainEventPublisher } from '../events';

export interface CurrencyProps {
  id: string;
  companyId?: string;
  code: string; // e.g. 'SAR', 'USD'
  name: string; // e.g. 'ريال سعودي'
  symbol: string; // e.g. 'ر.س'
  exchangeRate: number; // rate against base currency
  isDefault?: boolean;
  decimalPlaces?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Currency {
  public readonly id: string;
  public readonly companyId?: string;
  public readonly code: string;
  private _name: string;
  private _symbol: string;
  private _exchangeRate: number;
  private _isDefault: boolean;
  public readonly decimalPlaces: number;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: CurrencyProps) {
    Currency.validate(props);
    this.id = props.id;
    this.companyId = props.companyId;
    this.code = props.code.toUpperCase().trim();
    this._name = props.name.trim();
    this._symbol = props.symbol.trim();
    this._exchangeRate = props.isDefault ? 1 : props.exchangeRate;
    this._isDefault = props.isDefault ?? false;
    this.decimalPlaces = props.decimalPlaces ?? 2;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  public get name(): string { return this._name; }
  public get symbol(): string { return this._symbol; }
  public get exchangeRate(): number { return this._exchangeRate; }
  public get isDefault(): boolean { return this._isDefault; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Validation
  public static validate(props: CurrencyProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('Currency ID is required');
    if (!props.code || !props.code.trim()) errors.push('Currency code is required');
    if (!props.name || !props.name.trim()) errors.push('Currency name is required');
    if (!props.symbol || !props.symbol.trim()) errors.push('Currency symbol is required');
    if (!props.isDefault && (isNaN(props.exchangeRate) || props.exchangeRate <= 0)) {
      errors.push('Exchange rate must be a positive number');
    }
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Business Rules
  public updateExchangeRate(newRate: number): void {
    if (this._isDefault) {
      throw new BusinessRuleError('Default currency exchange rate is fixed to 1.0', 'DEFAULT_CURRENCY_RATE_FIXED');
    }
    if (isNaN(newRate) || newRate <= 0) {
      throw new ValidationError('Exchange rate must be positive');
    }
    const previousRate = this._exchangeRate;
    this._exchangeRate = newRate;
    this._updatedAt = new Date();

    DomainEventPublisher.getInstance().publish(createDomainEvent('CurrencyExchangeRateUpdated', this.id, {
      code: this.code,
      previousRate,
      newRate
    }));
  }

  public convertToBase(foreignAmount: number): Money {
    const baseAmount = foreignAmount * this._exchangeRate;
    return new Money(baseAmount, 'SAR');
  }

  public convertFromBase(baseAmount: number): Money {
    const foreignAmount = baseAmount / this._exchangeRate;
    return new Money(foreignAmount, this.code);
  }
}
