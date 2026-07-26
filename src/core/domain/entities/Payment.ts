import { ValidationError, BusinessRuleError } from '../errors';
import { Money } from '../valueObjects';
import { createDomainEvent, DomainEventPublisher } from '../events';

export type PaymentPartyType = 'customer' | 'supplier' | 'employee' | 'other';
export type PaymentMethodType = 'cash' | 'card' | 'bank_transfer' | 'check';
export type PaymentStatus = 'pending' | 'completed' | 'voided';

export interface PaymentProps {
  id: string;
  companyId?: string;
  branchId?: string;
  paymentNumber: string;
  invoiceId?: string;
  partyType: PaymentPartyType;
  partyId?: string;
  partyName?: string;
  amount: Money;
  paymentMethod: PaymentMethodType;
  referenceNumber?: string;
  date: string;
  notes?: string;
  status?: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Payment {
  public readonly id: string;
  public readonly companyId?: string;
  public readonly branchId?: string;
  public readonly paymentNumber: string;
  public readonly invoiceId?: string;
  public readonly partyType: PaymentPartyType;
  public readonly partyId?: string;
  public readonly partyName?: string;
  public readonly amount: Money;
  public readonly paymentMethod: PaymentMethodType;
  public readonly referenceNumber?: string;
  public readonly date: string;
  public readonly notes?: string;
  private _status: PaymentStatus;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: PaymentProps) {
    Payment.validate(props);
    this.id = props.id;
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this.paymentNumber = props.paymentNumber.trim();
    this.invoiceId = props.invoiceId;
    this.partyType = props.partyType;
    this.partyId = props.partyId;
    this.partyName = props.partyName?.trim();
    this.amount = props.amount;
    this.paymentMethod = props.paymentMethod;
    this.referenceNumber = props.referenceNumber?.trim();
    this.date = props.date;
    this.notes = props.notes?.trim();
    this._status = props.status || 'completed';
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  public get status(): PaymentStatus { return this._status; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Validation
  public static validate(props: PaymentProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('Payment ID is required');
    if (!props.paymentNumber || !props.paymentNumber.trim()) errors.push('Payment number is required');
    if (!props.partyType) errors.push('Party type is required');
    if (!props.amount || props.amount.amount <= 0) errors.push('Payment amount must be greater than zero');
    if (!props.paymentMethod) errors.push('Payment method is required');
    if (!props.date) errors.push('Payment date is required');
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Business Rules
  public complete(): void {
    if (this._status === 'completed') return;
    if (this._status === 'voided') {
      throw new BusinessRuleError('Cannot complete a voided payment', 'PAYMENT_VOIDED');
    }
    this._status = 'completed';
    this._updatedAt = new Date();

    DomainEventPublisher.getInstance().publish(createDomainEvent('PaymentCompleted', this.id, {
      paymentNumber: this.paymentNumber,
      amount: this.amount.amount,
      partyId: this.partyId,
      partyType: this.partyType
    }));
  }

  public void(reason: string): void {
    if (this._status === 'voided') return;
    this._status = 'voided';
    this._updatedAt = new Date();

    DomainEventPublisher.getInstance().publish(createDomainEvent('PaymentVoided', this.id, {
      paymentNumber: this.paymentNumber,
      reason
    }));
  }
}
