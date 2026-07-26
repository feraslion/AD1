export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  public readonly errors: string[];

  constructor(errors: string | string[]) {
    const errorList = Array.isArray(errors) ? errors : [errors];
    super(errorList.join('; '));
    this.name = 'ValidationError';
    this.errors = errorList;
  }
}

export class BusinessRuleError extends DomainError {
  public readonly ruleName?: string;
  public readonly code?: string;

  constructor(message: string, ruleName?: string, code?: string) {
    super(message);
    this.name = 'BusinessRuleError';
    this.ruleName = ruleName;
    this.code = code;
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string = 'المورد المطلوب غير موجود') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string = 'غير مصرح به - الرجاء تسجيل الدخول أولاً') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string = 'صلاحيات غير كافية لإجراء هذه العملية') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
