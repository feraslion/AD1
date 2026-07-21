// Central Error Handler for Enterprise POS & ERP System
import { logger } from './logger';

export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR'
  | 'BUSINESS_RULE_ERROR'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

export class AppError extends Error {
  public code: ErrorCode;
  public statusCode: number;
  public details: any;
  public isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    details: any = null,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;
    
    // Ensure correct prototype chain
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Arabic user-friendly error dictionary for high-quality enterprise feedback
const ERROR_TRANSLATIONS: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'خطأ في التحقق من البيانات. يرجى التأكد من الحقول المدخلة.',
  UNAUTHORIZED: 'غير مصرح بالعملية. يرجى تسجيل الدخول أولاً.',
  FORBIDDEN: 'ليست لديك الصلاحيات الكافية لإجراء هذه العملية.',
  NOT_FOUND: 'العنصر المطلوب غير موجود أو تم حذفه.',
  NETWORK_ERROR: 'فشل في الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت وإعادة المحاولة.',
  SERVER_ERROR: 'حدث خطأ في الخادم الداخلي. فريق الدعم يعمل على حل المشكلة حالياً.',
  BUSINESS_RULE_ERROR: 'العملية تتعارض مع السياسات المحاسبية أو التشغيلية للنظام.',
  DATABASE_ERROR: 'خطأ في قاعدة البيانات أثناء تخزين أو جلب البيانات.',
  UNKNOWN_ERROR: 'حدث خطأ غير متوقع. يرجى إعادة المحاولة لاحقاً.'
};

export const ErrorHandler = {
  /**
   * Identifies and standardizes any thrown error into an AppError
   */
  standardize: (error: any): AppError => {
    if (error instanceof AppError) {
      return error;
    }

    // Network errors (fetch fails to connect)
    if (error instanceof TypeError && error.message.toLowerCase().includes('fetch')) {
      return new AppError(
        'تعذر الاتصال بالخادم الرئيسي',
        'NETWORK_ERROR',
        503,
        error
      );
    }

    // Default error mapping
    const errMsg = error.message || error.toString() || 'خطأ غير معروف';
    return new AppError(
      errMsg,
      'SERVER_ERROR',
      500,
      error
    );
  },

  /**
   * Handles the standardized error by logging it and returning a user-friendly Arabic string
   */
  handle: (error: any, contextNamespace: string = 'System'): string => {
    const stdError = ErrorHandler.standardize(error);
    
    // Log utilizing central Logger
    logger.error(
      contextNamespace, 
      `Captured error: ${stdError.message} (Code: ${stdError.code}, Status: ${stdError.statusCode})`, 
      stdError.details || stdError.stack
    );

    // Get Arabic friendly error message
    const userFriendlyMessage = ERROR_TRANSLATIONS[stdError.code] || ERROR_TRANSLATIONS.UNKNOWN_ERROR;

    // If it is a validation error or business rule error, we append the specific error details or original message
    if (stdError.code === 'VALIDATION_ERROR' || stdError.code === 'BUSINESS_RULE_ERROR') {
      return stdError.message; // These are already customized in Arabic by the business rules
    }

    return userFriendlyMessage;
  },

  /**
   * Safe JSON parse with error catching
   */
  safeJsonParse: <T>(jsonString: string | null, fallback: T): T => {
    if (!jsonString) return fallback;
    try {
      return JSON.parse(jsonString) as T;
    } catch (e) {
      logger.warn('ErrorHandler', 'Failed to parse JSON string', jsonString, e);
      return fallback;
    }
  }
};
