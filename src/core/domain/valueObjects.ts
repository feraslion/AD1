import { ValidationError } from './errors';

export class Money {
  public readonly amount: number;
  public readonly currency: string;

  constructor(amount: number, currency: string = 'SAR') {
    if (isNaN(amount) || !isFinite(amount)) {
      throw new ValidationError('Amount must be a valid finite number');
    }
    if (!currency || currency.trim().length === 0) {
      throw new ValidationError('Currency code is required');
    }
    this.amount = Math.round(amount * 100) / 100;
    this.currency = currency.toUpperCase().trim();
  }

  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  public subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount - other.amount, this.currency);
  }

  public multiply(factor: number): Money {
    return new Money(this.amount * factor, this.currency);
  }

  public isZero(): boolean {
    return Math.abs(this.amount) < 0.001;
  }

  public isPositive(): boolean {
    return this.amount > 0;
  }

  public equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new ValidationError(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }
}

export class TaxRate {
  public readonly percentage: number;

  constructor(percentage: number) {
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      throw new ValidationError('Tax rate percentage must be between 0 and 100');
    }
    this.percentage = Math.round(percentage * 100) / 100;
  }

  public calculateTax(amount: number): number {
    return Math.round(amount * (this.percentage / 100) * 100) / 100;
  }

  public calculateTaxableBaseFromInclusive(inclusiveAmount: number): number {
    if (this.percentage === 0) return inclusiveAmount;
    return Math.round((inclusiveAmount / (1 + this.percentage / 100)) * 100) / 100;
  }
}

export class Email {
  public readonly value: string;

  constructor(email: string) {
    const trimmed = email ? email.trim().toLowerCase() : '';
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new ValidationError(`Invalid email format: ${email}`);
    }
    this.value = trimmed;
  }

  public isEmpty(): boolean {
    return this.value.length === 0;
  }
}

export class Phone {
  public readonly value: string;

  constructor(phone: string) {
    const trimmed = phone ? phone.trim() : '';
    if (trimmed && !/^\+?[0-9\s\-()]{7,20}$/.test(trimmed)) {
      throw new ValidationError(`Invalid phone format: ${phone}`);
    }
    this.value = trimmed;
  }

  public isEmpty(): boolean {
    return this.value.length === 0;
  }
}

export class Barcode {
  public readonly value: string;

  constructor(barcode: string) {
    const trimmed = barcode ? barcode.trim() : '';
    if (!trimmed) {
      throw new ValidationError('Barcode value cannot be empty');
    }
    this.value = trimmed;
  }
}

export class Address {
  public readonly street?: string;
  public readonly city?: string;
  public readonly country?: string;
  public readonly postalCode?: string;

  constructor(params: { street?: string; city?: string; country?: string; postalCode?: string }) {
    this.street = params.street?.trim();
    this.city = params.city?.trim();
    this.country = params.country?.trim() || 'Saudi Arabia';
    this.postalCode = params.postalCode?.trim();
  }

  public toString(): string {
    return [this.street, this.city, this.country, this.postalCode].filter(Boolean).join(', ');
  }
}

export class AccountCode {
  public readonly value: string;

  constructor(code: string) {
    const trimmed = code ? code.trim() : '';
    if (!trimmed || !/^\d+$/.test(trimmed)) {
      throw new ValidationError('Account code must contain digits only');
    }
    this.value = trimmed;
  }

  public getLevel(): number {
    return this.value.length;
  }

  public getParentCode(): string | null {
    if (this.value.length <= 1) return null;
    return this.value.substring(0, this.value.length - 1);
  }
}
