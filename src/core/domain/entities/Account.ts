import { ValidationError, BusinessRuleError } from '../errors';
import { AccountCode, Money } from '../valueObjects';
import { createDomainEvent, DomainEventPublisher } from '../events';

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface AccountProps {
  id: string;
  companyId?: string;
  code: AccountCode;
  name: string;
  type: AccountType;
  parentId?: string;
  balance?: Money;
  foreignBalance?: Money;
  currency?: string;
  isActive?: boolean;
  isHeader?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Account {
  public readonly id: string;
  public readonly companyId?: string;
  public readonly code: AccountCode;
  private _name: string;
  public readonly type: AccountType;
  public readonly parentId?: string;
  private _balance: Money;
  private _foreignBalance: Money;
  public readonly currency: string;
  private _isActive: boolean;
  public readonly isHeader: boolean;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: AccountProps) {
    Account.validate(props);
    this.id = props.id;
    this.companyId = props.companyId;
    this.code = props.code;
    this._name = props.name.trim();
    this.type = props.type;
    this.parentId = props.parentId;
    this.currency = (props.currency || 'SAR').toUpperCase().trim();
    this._balance = props.balance || new Money(0, this.currency);
    this._foreignBalance = props.foreignBalance || new Money(0, this.currency);
    this._isActive = props.isActive ?? true;
    this.isHeader = props.isHeader ?? false;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  public get name(): string { return this._name; }
  public get balance(): Money { return this._balance; }
  public get foreignBalance(): Money { return this._foreignBalance; }
  public get isActive(): boolean { return this._isActive; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Validation
  public static validate(props: AccountProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('Account ID is required');
    if (!props.code) errors.push('Account code object is required');
    if (!props.name || !props.name.trim()) errors.push('Account name is required');
    if (!['asset', 'liability', 'equity', 'revenue', 'expense'].includes(props.type)) {
      errors.push('Account type must be asset, liability, equity, revenue, or expense');
    }
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Business Rules
  public isDebitNormalNature(): boolean {
    return this.type === 'asset' || this.type === 'expense';
  }

  public recordTransaction(debitAmount: number, creditAmount: number): void {
    if (this.isHeader) {
      throw new BusinessRuleError('Cannot post directly to a header/parent account', 'HEADER_ACCOUNT_DIRECT_POSTING');
    }
    if (!this._isActive) {
      throw new BusinessRuleError('Cannot post to an inactive account', 'ACCOUNT_INACTIVE');
    }

    let delta = 0;
    if (this.isDebitNormalNature()) {
      delta = debitAmount - creditAmount;
    } else {
      delta = creditAmount - debitAmount;
    }

    const newBalanceAmount = this._balance.amount + delta;
    this._balance = new Money(newBalanceAmount, this.currency);
    this._updatedAt = new Date();

    DomainEventPublisher.getInstance().publish(createDomainEvent('AccountBalanceUpdated', this.id, {
      accountCode: this.code.value,
      newBalance: this._balance.amount,
      delta
    }));
  }

  public activate(): void {
    this._isActive = true;
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    if (Math.abs(this._balance.amount) > 0.001) {
      throw new BusinessRuleError('Cannot deactivate an account with a non-zero balance', 'NON_ZERO_BALANCE_DEACTIVATION');
    }
    this._isActive = false;
    this._updatedAt = new Date();
  }
}
