import { ValidationError, BusinessRuleError } from '../errors';
import { Address } from '../valueObjects';
import { createDomainEvent, DomainEventPublisher } from '../events';

export interface WarehouseProps {
  id: string;
  companyId: string;
  branchId?: string;
  name: string;
  code: string;
  location?: Address;
  capacity?: number;
  status?: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

export class Warehouse {
  public readonly id: string;
  public readonly companyId: string;
  private _branchId?: string;
  private _name: string;
  private _code: string;
  private _location?: Address;
  private _capacity?: number;
  private _status: 'active' | 'inactive';
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: WarehouseProps) {
    Warehouse.validate(props);
    this.id = props.id;
    this.companyId = props.companyId;
    this._branchId = props.branchId;
    this._name = props.name.trim();
    this._code = props.code.toUpperCase().trim();
    this._location = props.location;
    this._capacity = props.capacity;
    this._status = props.status || 'active';
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  public get branchId(): string | undefined { return this._branchId; }
  public get name(): string { return this._name; }
  public get code(): string { return this._code; }
  public get location(): Address | undefined { return this._location; }
  public get capacity(): number | undefined { return this._capacity; }
  public get status(): 'active' | 'inactive' { return this._status; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Validation
  public static validate(props: WarehouseProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('Warehouse ID is required');
    if (!props.companyId || !props.companyId.trim()) errors.push('Warehouse companyId is required');
    if (!props.name || !props.name.trim()) errors.push('Warehouse name is required');
    if (!props.code || !props.code.trim()) errors.push('Warehouse code is required');
    if (props.capacity !== undefined && props.capacity <= 0) {
      errors.push('Warehouse capacity must be greater than zero');
    }
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Business Rules
  public assignBranch(branchId: string): void {
    this._branchId = branchId;
    this._updatedAt = new Date();
  }

  public activate(): void {
    this._status = 'active';
    this._updatedAt = new Date();
    DomainEventPublisher.getInstance().publish(createDomainEvent('WarehouseStatusChanged', this.id, { status: 'active' }));
  }

  public deactivate(): void {
    this._status = 'inactive';
    this._updatedAt = new Date();
    DomainEventPublisher.getInstance().publish(createDomainEvent('WarehouseStatusChanged', this.id, { status: 'inactive' }));
  }
}
