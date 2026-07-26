import { ValidationError } from '../errors';

export interface PermissionProps {
  id: string;
  code: string; // e.g. 'sales:create', 'accounting:post'
  name: string;
  category: string; // e.g. 'sales', 'accounting', 'inventory'
  description?: string;
}

export class Permission {
  public readonly id: string;
  public readonly code: string;
  public readonly name: string;
  public readonly category: string;
  public readonly description?: string;

  constructor(props: PermissionProps) {
    Permission.validate(props);
    this.id = props.id;
    this.code = props.code.toLowerCase().trim();
    this.name = props.name.trim();
    this.category = props.category.toLowerCase().trim();
    this.description = props.description?.trim();
  }

  public static validate(props: PermissionProps): void {
    const errors: string[] = [];
    if (!props.id || !props.id.trim()) errors.push('Permission ID is required');
    if (!props.code || !props.code.trim()) errors.push('Permission code is required');
    if (!/^[a-z0-9_-]+:[a-z0-9_-]+$/.test(props.code.trim().toLowerCase())) {
      errors.push('Permission code must be formatted as category:action (e.g. sales:create)');
    }
    if (!props.name || !props.name.trim()) errors.push('Permission name is required');
    if (!props.category || !props.category.trim()) errors.push('Permission category is required');
    if (errors.length > 0) throw new ValidationError(errors);
  }

  public matches(permissionCode: string): boolean {
    return this.code === permissionCode.toLowerCase().trim();
  }
}
