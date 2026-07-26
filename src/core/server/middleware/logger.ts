import { Request, Response, NextFunction } from 'express';

export class Logger {
  static info(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  static warn(message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
  }

  static error(message: string, error?: any): void {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] [${timestamp}] ${message}`, error ? (error.stack || error) : '');
  }

  static debug(message: string, meta?: any): void {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.log(`[DEBUG] [${timestamp}] ${message}`, meta ? JSON.stringify(meta) : '');
    }
  }
}

export function requestLogger(req: Request & { user?: any }, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userStr = req.user ? `${req.user.name || req.user.id} (${req.user.role || 'user'})` : 'Guest';
    const status = res.statusCode;
    const logMsg = `[HTTP] [${timestamp}] ${req.method} ${req.originalUrl || req.url} ${status} - ${duration}ms - User: ${userStr}`;

    if (status >= 500) {
      Logger.error(logMsg);
    } else if (status >= 400) {
      Logger.warn(logMsg);
    } else {
      Logger.info(logMsg);
    }
  });

  next();
}
