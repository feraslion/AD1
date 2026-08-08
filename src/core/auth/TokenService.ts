import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const DEFAULT_JWT_SECRET = 'enterprise-erp-jwt-secret-key-2026';
const DEFAULT_REFRESH_SECRET = 'enterprise-erp-refresh-secret-key-2026';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_JWT_SECRET) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable must be configured with a secure non-default value in production!');
  }
  if (!process.env.REFRESH_SECRET || process.env.REFRESH_SECRET === DEFAULT_REFRESH_SECRET) {
    throw new Error('FATAL SECURITY ERROR: REFRESH_SECRET environment variable must be configured with a secure non-default value in production!');
  }
}

const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET || DEFAULT_REFRESH_SECRET;

export interface TokenPayload {
  id: string;
  uid?: string;
  email: string;
  name?: string;
  role: string;
  roleId?: string | null;
  companyId?: string | null;
  branchId?: string | null;
  permissions?: string[];
  sessionId?: string;
  type?: 'access' | 'refresh';
}

export class TokenService {
  /**
   * Generate short-lived Access Token (1 hour)
   */
  static generateAccessToken(user: TokenPayload): string {
    return jwt.sign(
      {
        id: user.id,
        uid: user.uid || user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        roleId: user.roleId,
        companyId: user.companyId,
        branchId: user.branchId,
        permissions: user.permissions || [],
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  /**
   * Generate long-lived Refresh Token (90 days)
   */
  static generateRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign(
      {
        id: userId,
        sessionId,
        type: 'refresh',
      },
      REFRESH_SECRET,
      { expiresIn: '90d' }
    );
  }

  /**
   * Verify Access Token
   */
  static verifyAccessToken(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
      if (decoded.type && decoded.type !== 'access') return null;
      return decoded;
    } catch (err) {
      return null;
    }
  }

  /**
   * Verify Refresh Token
   */
  static verifyRefreshToken(token: string): { id: string; sessionId: string } | null {
    try {
      const decoded = jwt.verify(token, REFRESH_SECRET) as any;
      if (decoded.type && decoded.type !== 'refresh') return null;
      return { id: decoded.id, sessionId: decoded.sessionId };
    } catch (err) {
      return null;
    }
  }

  /**
   * Hash password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  /**
   * Verify password against bcrypt hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    if (!hash) return false;
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate random secure hex token for password reset / email verification
   */
  static generateRandomToken(bytes = 32): string {
    return crypto.randomBytes(bytes).toString('hex');
  }
}
