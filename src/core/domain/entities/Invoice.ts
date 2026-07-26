import { ValidationError, BusinessRuleError } from '../errors';
import { Money, TaxRate } from '../valueObjects';
import { createDomainEvent, DomainEventPublisher } from '../events';

export type InvoiceType = 'sale' | 'purchase' | 'sale_return' | 'purchase_return';
export type InvoiceStatus = 'draft' | 'posted' | 'paid' | 'cancelled';

export interface InvoiceItemProps {
  id: string;
  productId: string;
  productName: string;
  barcode?: string;
  quantity: number;
  unitPrice: Money;
  discount?: number; // discount per item or percentage
  discountType?: 'fixed' | 'percentage';
  taxRate: TaxRate;
}

export class InvoiceItem {
  public readonly id: string;
  public readonly productId: string;
  public readonly productName: string;
  public readonly barcode?: string;
  public readonly quantity: number;
  public readonly unitPrice: Money;
  public readonly discount: number;
  public readonly discountType: 'fixed' | 'percentage';
  public readonly taxRate: TaxRate;

  constructor(props: InvoiceItemProps) {
    if (props.quantity <= 0) throw new ValidationError('Invoice item quantity must be positive');
    if (props.unitPrice.amount < 0) throw new ValidationError('Item unit price cannot be negative');
    this.id = props.id;
    this.productId = props.productId;
    this.productName = props.productName.trim();
    this.barcode = props.barcode?.trim();
    this.quantity = props.quantity;
    this.unitPrice = props.unitPrice;
    this.discount = props.discount ?? 0;
    this.discountType = props.discountType || 'fixed';
    this.taxRate = props.taxRate;
  }

  public get subtotalBeforeDiscount(): number {
    return Math.round(this.unitPrice.amount * this.quantity * 100) / 100;
  }

  public get discountAmount(): number {
    if (this.discount <= 0) return 0;
    if (this.discountType === 'percentage') {
      return Math.round(this.subtotalBeforeDiscount * (this.discount / 100) * 100) / 100;
    }
    return Math.round(this.discount * this.quantity * 100) / 100;
  }

  public get taxableAmount(): number {
    return Math.max(0, this.subtotalBeforeDiscount - this.discountAmount);
  }

  public get taxAmount(): number {
    return this.taxRate.calculateTax(this.taxableAmount);
  }

  public get grandTotal(): number {
    return Math.round((this.taxableAmount + this.taxAmount) * 100) / 100;
  }
}

export interface InvoiceProps {
  id: string;
  companyId?: string;
  branchId?: string;
  invoiceNumber: string;
  type: InvoiceType;
  partyId?: string; // customerId or supplierId
  partyName?: string;
  date: string;
  status?: InvoiceStatus;
  items?: InvoiceItem[];
  invoiceDiscount?: number;
  invoiceDiscountType?: 'fixed' | 'percentage';
  currency?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class Invoice {
  public readonly id: string;
  public readonly companyId?: string;
  public readonly branchId?: string;
  public readonly invoiceNumber: string;
  public readonly type: InvoiceType;
  public readonly partyId?: string;
  public readonly partyName?: string;
  public readonly date: string;
  private _status: InvoiceStatus;
  private _items: InvoiceItem[];
  private _invoiceDiscount: number;
  private _invoiceDiscountType: 'fixed' | 'percentage';
  public readonly currency: string;
  public readonly notes?: string;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: InvoiceProps) {
    Invoice.validate(props);
    this.id = props.id;
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this.invoiceNumber = props.invoiceNumber.trim();
    this.type = props.type;
    this.partyId = props.partyId;
    this.partyName = props.partyName?.trim();
    this.date = props.date;
    this._status = props.status || 'draft';
    this._items = props.items || [];
    this._invoiceDiscount = props.invoiceDiscount ?? 0;
    this._invoiceDiscountType = props.invoiceDiscountType || 'fixed';
    this.currency = (props.currency || 'SAR').toUpperCase().trim();
    this.notes = props.notes;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  public get status(): InvoiceStatus { return this._status; }
  public get items(): ReadonlyArray<InvoiceItem> { return this._items; }
  public get invoiceDiscount(): number { return this._invoiceDiscount; }
  public get invoiceDiscountType(): 'fixed' | 'percentage' { return this._invoiceDiscountType; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Validation
  public static validate(props: InvoiceProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('Invoice ID is required');
    if (!props.invoiceNumber || !props.invoiceNumber.trim()) errors.push('Invoice number is required');
    if (!props.type) errors.push('Invoice type is required');
    if (!props.date) errors.push('Invoice date is required');
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Calculations
  public get itemsSubtotal(): number {
    return Math.round(this._items.reduce((sum, item) => sum + item.taxableAmount, 0) * 100) / 100;
  }

  public get headerDiscountAmount(): number {
    if (this._invoiceDiscount <= 0) return 0;
    if (this._invoiceDiscountType === 'percentage') {
      return Math.round(this.itemsSubtotal * (this._invoiceDiscount / 100) * 100) / 100;
    }
    return Math.round(this._invoiceDiscount * 100) / 100;
  }

  public get taxableAmount(): number {
    return Math.max(0, this.itemsSubtotal - this.headerDiscountAmount);
  }

  public get taxAmount(): number {
    // Pro-rate tax or calculate sum of item taxes minus discount pro-rating
    return Math.round(this._items.reduce((sum, item) => sum + item.taxAmount, 0) * 100) / 100;
  }

  public get grandTotal(): number {
    return Math.round((this.taxableAmount + this.taxAmount) * 100) / 100;
  }

  // Business Rules
  public addItem(item: InvoiceItem): void {
    if (this._status !== 'draft') {
      throw new BusinessRuleError('Cannot modify items of a non-draft invoice', 'INVOICE_NOT_DRAFT');
    }
    this._items.push(item);
    this._updatedAt = new Date();
  }

  public removeItem(itemId: string): void {
    if (this._status !== 'draft') {
      throw new BusinessRuleError('Cannot modify items of a non-draft invoice', 'INVOICE_NOT_DRAFT');
    }
    this._items = this._items.filter(i => i.id !== itemId);
    this._updatedAt = new Date();
  }

  public post(): void {
    if (this._status !== 'draft') {
      throw new BusinessRuleError(`Invoice is already in state: ${this._status}`, 'INVOICE_ALREADY_PROCESSED');
    }
    if (this._items.length === 0) {
      throw new BusinessRuleError('Cannot post an invoice without items', 'INVOICE_NO_ITEMS');
    }
    this._status = 'posted';
    this._updatedAt = new Date();

    DomainEventPublisher.getInstance().publish(createDomainEvent('InvoicePosted', this.id, {
      invoiceNumber: this.invoiceNumber,
      grandTotal: this.grandTotal,
      partyId: this.partyId,
      type: this.type
    }));
  }

  public markAsPaid(): void {
    if (this._status === 'cancelled') {
      throw new BusinessRuleError('Cannot mark a cancelled invoice as paid', 'INVOICE_CANCELLED');
    }
    this._status = 'paid';
    this._updatedAt = new Date();

    DomainEventPublisher.getInstance().publish(createDomainEvent('InvoicePaid', this.id, {
      invoiceNumber: this.invoiceNumber,
      grandTotal: this.grandTotal
    }));
  }

  public cancel(reason: string): void {
    if (this._status === 'cancelled') return;
    this._status = 'cancelled';
    this._updatedAt = new Date();

    DomainEventPublisher.getInstance().publish(createDomainEvent('InvoiceCancelled', this.id, {
      invoiceNumber: this.invoiceNumber,
      reason
    }));
  }
}
