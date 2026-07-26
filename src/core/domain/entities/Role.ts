import { ValidationError, BusinessRuleError } from '../errors';
import { Permission } from './Permission';
import { createDomainEvent, DomainEventPublisher } from '../events';

export interface RoleProps {
  id: string;
  companyId?: string;
  name: string;
  code: string;
  description?: string;
  permissions?: string[]; // array of permission codes
  isSystemRole?: boolean;
}

export class Role {
  public readonly id: string;
  public readonly companyId?: string;
  private _name: string;
  private _code: string;
  private _description?: string;
  private _permissions: Set<string>;
  public readonly isSystemRole: boolean;

  constructor(props: RoleProps) {
    Role.validate(props);
    this.id = props.id;
    this.companyId = props.companyId;
    this._name = props.name.trim();
    this._code = props.code.toLowerCase().trim();
    this._description = props.description?.trim();
    this._permissions = new Set((props.permissions || []).map(p => p.toLowerCase().trim()));
    this.isSystemRole = props.isSystemRole ?? false;
  }

  // Getters
  public get name(): string { return this._name; }
  public get code(): string { return this._code; }
  public get description(): string | undefined { return this._description; }
  public get permissions(): string[] { return Array.from(this._permissions); }

  // Validation
  public static validate(props: RoleProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('Role ID is required');
    if (!props.name || !props.name.trim()) errors.push('Role name is required');
    if (!props.code || !props.code.trim()) errors.push('Role code is required');
    if (errors.length > 0) throw new ValidationError(errors);
  }

  // Business Rules
  public addPermission(permissionCode: string): void {
    const code = permissionCode.toLowerCase().trim();
    if (!this._permissions.has(code)) {
      this._permissions.add(code);
      DomainEventPublisher.getInstance().publish(createDomainEvent('PermissionAddedToRole', this.id, { permissionCode: code }));
    }
  }

  public removePermission(permissionCode: string): void {
    if (this.isSystemRole) {
      throw new BusinessRuleError('Cannot modify permissions of system roles', 'PROTECTED_SYSTEM_ROLE');
    }
    const code = permissionCode.toLowerCase().trim();
    if (this._permissions.has(code)) {
      this._permissions.delete(code);
      DomainEventPublisher.getInstance().publish(createDomainEvent('PermissionRemovedFromRole', this.id, { permissionCode: code }));
    }
  }

  public hasPermission(permissionCode: string): boolean {
    const code = permissionCode.toLowerCase().trim();
    if (this._permissions.has('*') || this._permissions.has('admin:all')) return true;
    return this._permissions.has(code);
  }
}
