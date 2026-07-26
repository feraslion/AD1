import { ValidationError, BusinessRuleError } from '../errors';
import { Address, TaxRate } from '../valueObjects';
import { createDomainEvent, DomainEventPublisher, DomainEvent } from '../events';

export interface CompanyProps {
  id: string;
  name: string;
  taxNumber?: string;
  commercialRegister?: string;
  currency?: string;
  address?: Address;
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export class Company {
  public readonly id: string;
  private _name: string;
  private _taxNumber?: string;
  private _commercialRegister?: string;
  private _currency: string;
  private _address?: Address;
  private _status: 'active' | 'inactive';
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: CompanyProps) {
    Company.validate(props);
    this.id = props.id;
    this._name = props.name.trim();
    this._taxNumber = props.taxNumber?.trim();
    this._commercialRegister = props.commercialRegister?.trim();
    this._currency = (props.currency || 'SAR').toUpperCase().trim();
    this._address = props.address;
    this._status = props.status || 'active';
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  public get name(): string { return this._name; }
  public get taxNumber(): string | undefined { return this._taxNumber; }
  public get commercialRegister(): string | undefined { return this._commercialRegister; }
  public get currency(): string { return this._currency; }
  public get address(): Address | undefined { return this._address; }
  public get status(): 'active' | 'inactive' { return this._status; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Validation
  public static validate(props: CompanyProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('Company ID is required');
    if (!props.name || !props.name.trim()) errors.push('Company name is required');
    if (props.taxNumber && !/^\d{15}$/.test(props.taxNumber.trim())) {
      errors.push('Saudi VAT Tax Number must be 15 digits');
    }
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Business Rules & State Mutations
  public updateProfile(name: string, taxNumber?: string, commercialRegister?: string): void {
    Company.validate({ id: this.id, name, taxNumber });
    this._name = name.trim();
    this._taxNumber = taxNumber?.trim();
    this._commercialRegister = commercialRegister?.trim();
    this._updatedAt = new Date();

    const event = createDomainEvent('CompanyProfileUpdated', this.id, {
      name: this._name,
      taxNumber: this._taxNumber
    });
    DomainEventPublisher.getInstance().publish(event);
  }

  public activate(): void {
    if (this._status === 'active') return;
    this._status = 'active';
    this._updatedAt = new Date();
    DomainEventPublisher.getInstance().publish(createDomainEvent('CompanyActivated', this.id, {}));
  }

  public deactivate(): void {
    if (this._status === 'inactive') return;
    this._status = 'inactive';
    this._updatedAt = new Date();
    DomainEventPublisher.getInstance().publish(createDomainEvent('CompanyDeactivated', this.id, {}));
  }
}
