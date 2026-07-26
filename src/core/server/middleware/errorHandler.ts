import { Request, Response, NextFunction } from 'express';
import { ValidationError, BusinessRuleError, NotFoundError, UnauthorizedError, ForbiddenError } from '../../domain/index.ts';
import { Logger } from './logger.ts';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  Logger.error(`Error handling route ${req.method} ${req.originalUrl}: ${err.message || err}`, err);

  // Handle Domain Errors
  if (err instanceof ValidationError) {
    return res.status(400).json({
      success: false,
      error: 'خطأ في التحقق من البيانات',
      details: err.errors,
      statusCode: 400
    });
  }

  if (err instanceof BusinessRuleError) {
    return res.status(400).json({
      success: false,
      error: err.message,
      code: err.code,
      statusCode: 400
    });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({
      success: false,
      error: err.message,
      statusCode: 404
    });
  }

  if (err instanceof UnauthorizedError) {
    return res.status(401).json({
      success: false,
      error: err.message,
      statusCode: 401
    });
  }

  if (err instanceof ForbiddenError) {
    return res.status(403).json({
      success: false,
      error: err.message,
      statusCode: 403
    });
  }

  // Handle Database / Drizzle Errors
  if (err.code === '23505') { // Postgres Unique Violation
    return res.status(409).json({
      success: false,
      error: 'الفرادة مكررة: يوجد سجلا متطابقا مسجلاً بالفعل بالرمز أو الرقم نفسه',
      details: err.detail,
      statusCode: 409
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'حدث خطأ غير متوقع في الخادم الداخلي';

  return res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    statusCode
  });
}
