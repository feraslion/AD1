import { ValidationError } from '../errors';
import { TaxRate } from '../valueObjects';
import { createDomainEvent, DomainEventPublisher } from '../events';

export interface TaxProps {
  id: string;
  companyId?: string;
  code: string; // e.g. 'VAT_15'
  name: string; // e.g. 'ضريبة القيمة المضافة 15%'
  taxRate: TaxRate;
  isInclusive?: boolean;
  isDefault?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Tax {
  public readonly id: string;
  public readonly companyId?: string;
  public readonly code: string;
  private _name: string;
  private _taxRate: TaxRate;
  private _isInclusive: boolean;
  private _isDefault: boolean;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: TaxProps) {
    Tax.validate(props);
    this.id = props.id;
    this.companyId = props.companyId;
    this.code = props.code.toUpperCase().trim();
    this._name = props.name.trim();
    this._taxRate = props.taxRate;
    this._isInclusive = props.isInclusive ?? false;
    this._isDefault = props.isDefault ?? false;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  public get name(): string { return this._name; }
  public get taxRate(): TaxRate { return this._taxRate; }
  public get isInclusive(): boolean { return this._isInclusive; }
  public get isDefault(): boolean { return this._isDefault; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Validation
  public static validate(props: TaxProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('Tax ID is required');
    if (!props.code || !props.code.trim()) errors.push('Tax code is required');
    if (!props.name || !props.name.trim()) errors.push('Tax name is required');
    if (!props.taxRate) errors.push('TaxRate object is required');
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Business Rules
  public calculateTaxAmount(amount: number): number {
    if (this._isInclusive) {
      const base = this._taxRate.calculateTaxableBaseFromInclusive(amount);
      return Math.round((amount - base) * 100) / 100;
    }
    return this._taxRate.calculateTax(amount);
  }

  public calculateTaxableBase(amount: number): number {
    if (this._isInclusive) {
      return this._taxRate.calculateTaxableBaseFromInclusive(amount);
    }
    return amount;
  }
}
