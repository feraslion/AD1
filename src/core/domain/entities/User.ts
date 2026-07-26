import { ValidationError, BusinessRuleError } from '../errors';
import { Email, Phone } from '../valueObjects';
import { createDomainEvent, DomainEventPublisher } from '../events';

export interface UserProps {
  id: string;
  uid?: string;
  companyId?: string;
  branchId?: string;
  name: string;
  email: Email;
  phone?: Phone;
  roleId: string;
  roleCode?: string;
  status?: 'active' | 'inactive';
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class User {
  public readonly id: string;
  public readonly uid?: string;
  public readonly companyId?: string;
  private _branchId?: string;
  private _name: string;
  public readonly email: Email;
  private _phone?: Phone;
  private _roleId: string;
  private _roleCode?: string;
  private _status: 'active' | 'inactive';
  private _lastLoginAt?: Date;
  public readonly createdAt: Date;
  private _updatedAt: Date;

  constructor(props: UserProps) {
    User.validate(props);
    this.id = props.id;
    this.uid = props.uid;
    this.companyId = props.companyId;
    this._branchId = props.branchId;
    this._name = props.name.trim();
    this.email = props.email;
    this._phone = props.phone;
    this._roleId = props.roleId;
    this._roleCode = props.roleCode;
    this._status = props.status || 'active';
    this._lastLoginAt = props.lastLoginAt;
    this.createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  // Getters
  public get name(): string { return this._name; }
  public get branchId(): string | undefined { return this._branchId; }
  public get phone(): Phone | undefined { return this._phone; }
  public get roleId(): string { return this._roleId; }
  public get roleCode(): string | undefined { return this._roleCode; }
  public get status(): 'active' | 'inactive' { return this._status; }
  public get lastLoginAt(): Date | undefined { return this._lastLoginAt; }
  public get updatedAt(): Date { return this._updatedAt; }

  // Validation
  public static validate(props: UserProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('User ID is required');
    if (!props.name || !props.name.trim()) errors.push('User name is required');
    if (!props.email || props.email.isEmpty()) errors.push('Valid user email is required');
    if (!props.roleId || !props.roleId.trim()) errors.push('User roleId is required');
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Business Rules
  public assignRole(roleId: string, roleCode?: string): void {
    if (!roleId || !roleId.trim()) {
      throw new ValidationError('Role ID is required');
    }
    this._roleId = roleId;
    this._roleCode = roleCode;
    this._updatedAt = new Date();
    DomainEventPublisher.getInstance().publish(createDomainEvent('UserRoleAssigned', this.id, { roleId, roleCode }));
  }

  public assignBranch(branchId: string): void {
    this._branchId = branchId;
    this._updatedAt = new Date();
  }

  public recordLogin(): void {
    if (this._status === 'inactive') {
      throw new BusinessRuleError('Inactive user cannot log in', 'USER_INACTIVE');
    }
    this._lastLoginAt = new Date();
    DomainEventPublisher.getInstance().publish(createDomainEvent('UserLoggedIn', this.id, { timestamp: this._lastLoginAt }));
  }

  public activate(): void {
    this._status = 'active';
    this._updatedAt = new Date();
  }

  public deactivate(): void {
    this._status = 'inactive';
    this._updatedAt = new Date();
    DomainEventPublisher.getInstance().publish(createDomainEvent('UserDeactivated', this.id, {}));
  }
}
