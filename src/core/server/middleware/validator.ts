import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../../domain/index.ts';

export interface FieldValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'email';
  minLength?: number;
  min?: number;
  nonNegative?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface ValidationSchema {
  body?: FieldValidationRule[];
  query?: FieldValidationRule[];
  params?: FieldValidationRule[];
}

export function validateRequest(schema: ValidationSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    const checkLocation = (rules: FieldValidationRule[] = [], locationData: any, locationName: string) => {
      for (const rule of rules) {
        const val = locationData ? locationData[rule.field] : undefined;

        // Check required
        if (rule.required && (val === undefined || val === null || val === '')) {
          errors.push(`الحقل '${rule.field}' في ${locationName} مطلوب`);
          continue;
        }

        if (val !== undefined && val !== null && val !== '') {
          // Check type
          if (rule.type === 'string' && typeof val !== 'string') {
            errors.push(`الحقل '${rule.field}' يجب أن يكون نصاً`);
          } else if (rule.type === 'number' && (typeof val !== 'number' && isNaN(Number(val)))) {
            errors.push(`الحقل '${rule.field}' يجب أن يكون رقماً`);
          } else if (rule.type === 'boolean' && typeof val !== 'boolean' && val !== 'true' && val !== 'false') {
            errors.push(`الحقل '${rule.field}' يجب أن يكون قيمة منطقية (true/false)`);
          } else if (rule.type === 'array' && !Array.isArray(val)) {
            errors.push(`الحقل '${rule.field}' يجب أن يكون مصفوفة`);
          } else if (rule.type === 'email' && (typeof val !== 'string' || !val.includes('@'))) {
            errors.push(`الحقل '${rule.field}' يجب أن يكون بريداً إلكترونياً صالحاً`);
          }

          // Check minLength
          if (rule.minLength && typeof val === 'string' && val.length < rule.minLength) {
            errors.push(`الحقل '${rule.field}' يجب أن لا يقل عن ${rule.minLength} أحرف`);
          }

          // Check min number
          if (rule.min !== undefined && Number(val) < rule.min) {
            errors.push(`الحقل '${rule.field}' يجب أن لا يقل عن ${rule.min}`);
          }

          // Check nonNegative
          if (rule.nonNegative && Number(val) < 0) {
            errors.push(`الحقل '${rule.field}' يجب أن لا يكون سالباً`);
          }

          // Custom validator
          if (rule.custom) {
            const customResult = rule.custom(val);
            if (customResult === false) {
              errors.push(`الحقل '${rule.field}' غير صالح`);
            } else if (typeof customResult === 'string') {
              errors.push(customResult);
            }
          }
        }
      }
    };

    if (schema.body) checkLocation(schema.body, req.body, 'نص الطلب');
    if (schema.query) checkLocation(schema.query, req.query, 'المعاملات');
    if (schema.params) checkLocation(schema.params, req.params, 'معاملات المسار');

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'خطأ في التحقق من صحة البيانات المُدخلة',
        details: errors,
        statusCode: 400
      });
    }

    next();
  };
}
