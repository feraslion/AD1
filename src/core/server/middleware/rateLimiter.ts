import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number; // Time window in ms (e.g., 15 * 60 * 1000 for 15 minutes)
  max: number;      // Max requests per IP in the window
  message?: string;
}

interface ClientRequestRecord {
  count: number;
  resetTime: number;
}

const clientStore = new Map<string, ClientRequestRecord>();

// Cleanup stale client records periodically
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of clientStore.entries()) {
    if (now > record.resetTime) {
      clientStore.delete(ip);
    }
  }
}, 60 * 1000);

if (cleanupInterval && typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}

export function createRateLimiter(options: RateLimitOptions) {
  const { windowMs, max, message = 'تم تجاوز الحد الأقصى للطلبات. الرجاء المحاولة مرة أخرى لاحقاً.' } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const now = Date.now();

    let record = clientStore.get(ip);

    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs
      };
      clientStore.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      return res.status(429).json({
        success: false,
        error: message,
        statusCode: 429,
        retryAfter: resetSeconds
      });
    }

    next();
  };
}

// Pre-configured rate limiters
export const defaultRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // 1000 requests per 15 minutes per IP
});

export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100 // 100 requests per 15 minutes for auth / sensitive operations
});
