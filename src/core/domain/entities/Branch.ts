import { ValidationError, BusinessRuleError } from '../errors';
import { Phone, Address } from '../valueObjects';
import { createDomainEvent, DomainEventPublisher } from '../events';

export interface BranchProps {
  id: string;
  companyId: string;
  name: string;
  code: string;
  isMain?: boolean;
  phone?: Phone;
  address?: Address;
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export class Branch {
  public readonly id: string;
  public readonly companyId: string;
  private _name: string;
  private _code: string;
  private _isMain: boolean;
  private _phone?: Phone;
  private _address?: Address;
  private _status: 'active' | 'inactive';
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: BranchProps) {
    Branch.validate(props);
    this.id = props.id;
    this.companyId = props.companyId;
    this._name = props.name.trim();
    this._code = props.code.trim().toUpperCase();
    this._isMain = props.isMain ?? false;
    this._phone = props.phone;
    this._address = props.address;
    this._status = props.status || 'active';
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  public get name(): string { return this._name; }
  public get code(): string { return this._code; }
  public get isMain(): boolean { return this._isMain; }
  public get phone(): Phone | undefined { return this._phone; }
  public get address(): Address | undefined { return this._address; }
  public get status(): 'active' | 'inactive' { return this._status; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Validation
  public static validate(props: BranchProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('Branch ID is required');
    if (!props.companyId || !props.companyId.trim()) errors.push('Branch companyId is required');
    if (!props.name || !props.name.trim()) errors.push('Branch name is required');
    if (!props.code || !props.code.trim()) errors.push('Branch code is required');
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Business Rules
  public setAsMain(): void {
    if (this._isMain) return;
    this._isMain = true;
    this._updatedAt = new Date();
    DomainEventPublisher.getInstance().publish(createDomainEvent('BranchSetAsMain', this.id, { companyId: this.companyId }));
  }

  public unsetMain(): void {
    this._isMain = false;
    this._updatedAt = new Date();
  }

  public updateBranch(name: string, phone?: Phone, address?: Address): void {
    Branch.validate({ id: this.id, companyId: this.companyId, name, code: this._code });
    this._name = name.trim();
    this._phone = phone;
    this._address = address;
    this._updatedAt = new Date();
  }
}
