import { ValidationError, BusinessRuleError } from '../errors';
import { Money, Phone, Email, Address } from '../valueObjects';
import { createDomainEvent, DomainEventPublisher } from '../events';

export interface CustomerProps {
  id: string;
  companyId?: string;
  branchId?: string;
  name: string;
  phone?: Phone;
  email?: Email;
  address?: Address;
  taxNumber?: string;
  balance?: Money;
  creditLimit?: Money;
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export class Customer {
  public readonly id: string;
  public readonly companyId?: string;
  public readonly branchId?: string;
  private _name: string;
  private _phone?: Phone;
  private _email?: Email;
  private _address?: Address;
  private _taxNumber?: string;
  private _balance: Money;
  private _creditLimit?: Money;
  private _status: 'active' | 'inactive';
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: CustomerProps) {
    Customer.validate(props);
    this.id = props.id;
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this._name = props.name.trim();
    this._phone = props.phone;
    this._email = props.email;
    this._address = props.address;
    this._taxNumber = props.taxNumber?.trim();
    this._balance = props.balance || new Money(0);
    this._creditLimit = props.creditLimit;
    this._status = props.status || 'active';
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  public get name(): string { return this._name; }
  public get phone(): Phone | undefined { return this._phone; }
  public get email(): Email | undefined { return this._email; }
  public get address(): Address | undefined { return this._address; }
  public get taxNumber(): string | undefined { return this._taxNumber; }
  public get balance(): Money { return this._balance; }
  public get creditLimit(): Money | undefined { return this._creditLimit; }
  public get status(): 'active' | 'inactive' { return this._status; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Validation
  public static validate(props: CustomerProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('Customer ID is required');
    if (!props.name || !props.name.trim()) errors.push('Customer name is required');
    if (props.taxNumber && !/^\d{15}$/.test(props.taxNumber.trim())) {
      errors.push('Customer VAT Tax Number must be 15 digits');
    }
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Business Rules
  public updateCreditLimit(newLimit: Money): void {
    if (newLimit.amount < 0) {
      throw new ValidationError('Credit limit cannot be negative');
    }
    this._creditLimit = newLimit;
    this._updatedAt = new Date();
    DomainEventPublisher.getInstance().publish(createDomainEvent('CustomerCreditLimitUpdated', this.id, { limit: newLimit.amount }));
  }

  public canPurchaseOnCredit(amount: Money): boolean {
    if (this._status === 'inactive') return false;
    if (!this._creditLimit) return true; // unlimited
    const potentialBalance = this._balance.add(amount);
    return potentialBalance.amount <= this._creditLimit.amount;
  }

  public recordInvoiceDebit(amount: Money): void {
    if (this._status === 'inactive') {
      throw new BusinessRuleError('Cannot bill an inactive customer', 'CUSTOMER_INACTIVE');
    }
    if (!this.canPurchaseOnCredit(amount)) {
      throw new BusinessRuleError(`Credit limit exceeded for customer ${this._name}`, 'CREDIT_LIMIT_EXCEEDED');
    }
    this._balance = this._balance.add(amount);
    this._updatedAt = new Date();
    DomainEventPublisher.getInstance().publish(createDomainEvent('CustomerBalanceUpdated', this.id, { newBalance: this._balance.amount, type: 'debit' }));
  }

  public recordPaymentCredit(amount: Money): void {
    this._balance = this._balance.subtract(amount);
    this._updatedAt = new Date();
    DomainEventPublisher.getInstance().publish(createDomainEvent('CustomerBalanceUpdated', this.id, { newBalance: this._balance.amount, type: 'credit' }));
  }
}
