import { ValidationError, BusinessRuleError } from '../errors';
import { Money } from '../valueObjects';
import { createDomainEvent, DomainEventPublisher } from '../events';

export type JournalStatus = 'draft' | 'posted' | 'voided';

export interface JournalLineProps {
  id: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debit: number;
  credit: number;
  description?: string;
  currency?: string;
  exchangeRate?: number;
  foreignDebit?: number;
  foreignCredit?: number;
}

export class JournalLine {
  public readonly id: string;
  public readonly accountId: string;
  public readonly accountCode?: string;
  public readonly accountName?: string;
  public readonly debit: number;
  public readonly credit: number;
  public readonly description?: string;
  public readonly currency: string;
  public readonly exchangeRate: number;
  public readonly foreignDebit: number;
  public readonly foreignCredit: number;

  constructor(props: JournalLineProps) {
    if (!props.accountId) throw new ValidationError('Journal line account ID is required');
    if (props.debit < 0 || props.credit < 0) throw new ValidationError('Debit and Credit amounts cannot be negative');
    if (props.debit === 0 && props.credit === 0) throw new ValidationError('Journal line must have non-zero debit or credit');

    this.id = props.id;
    this.accountId = props.accountId;
    this.accountCode = props.accountCode;
    this.accountName = props.accountName;
    this.debit = Math.round(props.debit * 100) / 100;
    this.credit = Math.round(props.credit * 100) / 100;
    this.description = props.description?.trim();
    this.currency = (props.currency || 'SAR').toUpperCase().trim();
    this.exchangeRate = props.exchangeRate || 1.0;
    this.foreignDebit = Math.round((props.foreignDebit ?? (props.debit / this.exchangeRate)) * 100) / 100;
    this.foreignCredit = Math.round((props.foreignCredit ?? (props.credit / this.exchangeRate)) * 100) / 100;
  }
}

export interface JournalEntryProps {
  id: string;
  companyId?: string;
  branchId?: string;
  entryNumber: string;
  date: string;
  description: string;
  reference?: string;
  currency?: string;
  exchangeRate?: number;
  status?: JournalStatus;
  lines?: JournalLine[];
  createdAt?: Date;
  updatedAt?: Date;
}

export class JournalEntry {
  public readonly id: string;
  public readonly companyId?: string;
  public readonly branchId?: string;
  public readonly entryNumber: string;
  public readonly date: string;
  private _description: string;
  private _reference?: string;
  public readonly currency: string;
  public readonly exchangeRate: number;
  private _status: JournalStatus;
  private _lines: JournalLine[];
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: JournalEntryProps) {
    JournalEntry.validate(props);
    this.id = props.id;
    this.companyId = props.companyId;
    this.branchId = props.branchId;
    this.entryNumber = props.entryNumber.trim();
    this.date = props.date;
    this._description = props.description.trim();
    this._reference = props.reference?.trim();
    this.currency = (props.currency || 'SAR').toUpperCase().trim();
    this.exchangeRate = props.exchangeRate || 1.0;
    this._status = props.status || 'draft';
    this._lines = props.lines || [];
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  public get description(): string { return this._description; }
  public get reference(): string | undefined { return this._reference; }
  public get status(): JournalStatus { return this._status; }
  public get lines(): ReadonlyArray<JournalLine> { return this._lines; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Validation
  public static validate(props: JournalEntryProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('JournalEntry ID is required');
    if (!props.entryNumber || !props.entryNumber.trim()) errors.push('Journal entry number is required');
    if (!props.date) errors.push('Journal entry date is required');
    if (!props.description || !props.description.trim()) errors.push('Journal entry description is required');
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Business Calculations
  public get totalDebit(): number {
    return Math.round(this._lines.reduce((sum, l) => sum + l.debit, 0) * 100) / 100;
  }

  public get totalCredit(): number {
    return Math.round(this._lines.reduce((sum, l) => sum + l.credit, 0) * 100) / 100;
  }

  public isBalanced(): boolean {
    return Math.abs(this.totalDebit - this.totalCredit) < 0.01;
  }

  // Business Rules
  public addLine(line: JournalLine): void {
    if (this._status !== 'draft') {
      throw new BusinessRuleError('Cannot modify lines of a posted/voided journal entry', 'ENTRY_NOT_DRAFT');
    }
    this._lines.push(line);
    this._updatedAt = new Date();
  }

  public removeLine(lineId: string): void {
    if (this._status !== 'draft') {
      throw new BusinessRuleError('Cannot modify lines of a posted/voided journal entry', 'ENTRY_NOT_DRAFT');
    }
    this._lines = this._lines.filter(l => l.id !== lineId);
    this._updatedAt = new Date();
  }

  public post(): void {
    if (this._status !== 'draft') {
      throw new BusinessRuleError(`Journal entry is already ${this._status}`, 'ENTRY_ALREADY_PROCESSED');
    }
    if (this._lines.length < 2) {
      throw new BusinessRuleError('Journal entry must have at least two lines to be posted', 'MIN_TWO_LINES_REQUIRED');
    }
    if (!this.isBalanced()) {
      throw new BusinessRuleError(`Unbalanced entry: Debit = ${this.totalDebit}, Credit = ${this.totalCredit}`, 'UNBALANCED_JOURNAL_ENTRY');
    }
    this._status = 'posted';
    this._updatedAt = new Date();

    DomainEventPublisher.getInstance().publish(createDomainEvent('JournalEntryPosted', this.id, {
      entryNumber: this.entryNumber,
      totalDebit: this.totalDebit,
      totalCredit: this.totalCredit
    }));
  }

  public void(reason: string): void {
    if (this._status === 'voided') return;
    this._status = 'voided';
    this._updatedAt = new Date();

    DomainEventPublisher.getInstance().publish(createDomainEvent('JournalEntryVoided', this.id, {
      entryNumber: this.entryNumber,
      reason
    }));
  }
}
