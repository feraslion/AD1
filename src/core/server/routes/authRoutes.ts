import { Router, Request, Response } from 'express';
import { db } from '../../database/index.ts';
import { users, userSessions, roles, permissions, rolePermissions } from '../../database/schema.ts';
import { eq, and, gt, sql } from 'drizzle-orm';
import { TokenService } from '../../auth/TokenService.ts';
import { AuthenticatedRequest, ROLE_DEFAULT_PERMISSIONS, authenticate, requireRole } from '../middleware/auth.ts';

export const authRouter = Router();

/**
 * 1. POST /api/auth/login
 * Login with email/password OR employee code/PIN
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, code, pin, identifier } = req.body;
    let userRecord: any = null;

    // Search by email or identifier
    const targetIdentifier = email || identifier;
    if (targetIdentifier) {
      const [u] = await db.select().from(users).where(eq(users.email, targetIdentifier));
      if (!u) {
        // Try searching by ID/code
        const [u2] = await db.select().from(users).where(eq(users.id, targetIdentifier));
        userRecord = u2;
      } else {
        userRecord = u;
      }
    } else if (code) {
      const [u] = await db.select().from(users).where(eq(users.id, code));
      userRecord = u;
    }

    if (!userRecord) {
      return res.status(401).json({
        success: false,
        error: 'بيانات الاعتماد غير صحيحة - اسم المستخدم أو البريد الإلكتروني غير موجود'
      });
    }

    if (userRecord.isActive === false || userRecord.isDeleted) {
      return res.status(401).json({
        success: false,
        error: 'حساب المستخدم معطل أو محذوف'
      });
    }

    // Verify credentials only against values stored for this user; no static credentials exist.
    if (password) {
      if (!(userRecord as any).passwordHash) {
        return res.status(401).json({ success: false, error: 'لم تُهيأ كلمة مرور لهذا الحساب بعد' });
      }
      const isPasswordValid = await TokenService.comparePassword(password, (userRecord as any).passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: 'كلمة المرور التي أدخلتها غير صحيحة' });
      }
    } else if (pin) {
      const expectedPin = (userRecord as any).pin;
      if (!expectedPin || pin !== expectedPin) {
        return res.status(401).json({ success: false, error: 'رمز PIN الذي أدخلته غير صحيح' });
      }
    } else {
      return res.status(400).json({ success: false, error: 'أدخل كلمة المرور أو رمز PIN' });
    }

    // Load User Permissions
    let userPermissions: string[] = [];
    if (userRecord.roleId) {
      try {
        const perms = await db
          .select({ code: permissions.code })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, userRecord.roleId));
        userPermissions = perms.map(p => p.code);
      } catch (err) {
        // Fallback
      }
    }

    const userRole = userRecord.role || 'cashier';
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[userRole] || ROLE_DEFAULT_PERMISSIONS.cashier;
    const finalPermissions = Array.from(new Set([...userPermissions, ...defaultPerms]));

    // Generate Session ID & Store Session in DB
    const sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const accessToken = TokenService.generateAccessToken({
      id: userRecord.id,
      uid: userRecord.uid || userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRole,
      roleId: userRecord.roleId,
      companyId: userRecord.companyId,
      branchId: userRecord.branchId,
      permissions: finalPermissions,
      sessionId
    });

    const refreshToken = TokenService.generateRefreshToken(userRecord.id, sessionId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    try {
      await db.insert(userSessions).values({
        id: sessionId,
        userId: userRecord.id,
        refreshToken,
        ipAddress: req.ip || req.socket.remoteAddress || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'App',
        isRevoked: false,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (sessionDbErr) {
      console.warn('Session DB log failed:', sessionDbErr);
    }

    return res.json({
      success: true,
      token: accessToken,
      refreshToken,
      sessionId,
      user: {
        id: userRecord.id,
        uid: userRecord.uid || userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        role: userRole,
        roleId: userRecord.roleId,
        code: userRecord.id,
        companyId: userRecord.companyId,
        branchId: userRecord.branchId,
        permissions: finalPermissions,
        isVerified: userRecord.isEmailVerified ?? true
      }
    });
  } catch (error: any) {
    console.error('Error during login:', error);
    return res.status(500).json({
      success: false,
      error: 'حدث خطأ في الخادم أثناء تسجيل الدخول'
    });
  }
});

/**
 * 2. POST /api/auth/register
 * Register a new employee/user (Supports Firebase Auth UID or system user creation)
 */
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, name, password, role, pin } = req.body;

    if (!email || !name || !password || !pin || !role) {
      return res.status(400).json({
        success: false,
        error: 'الاسم والبريد وكلمة المرور ورمز PIN والدور مطلوبة'
      });
    }
    if (!/^\d{4,8}$/.test(pin)) {
      return res.status(400).json({ success: false, error: 'رمز PIN يجب أن يحتوي من 4 إلى 8 أرقام' });
    }

    // Check if email exists
    const [existing] = await db.select().from(users).where(eq(users.email, email));
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }

    const userId = 'usr_' + Date.now();
    const passwordHash = await TokenService.hashPassword(password);
    const verificationToken = TokenService.generateRandomToken(24);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
    const isFirstUser = Number(userCount[0]?.count || 0) === 0;
    const requestedRole = role === 'manager' || role === 'accountant' || role === 'inventory' || role === 'cashier' ? role : 'cashier';

    await db.insert(users).values({
      id: userId,
      uid: userId,
      email,
      name,
      role: isFirstUser ? 'manager' : requestedRole,
      passwordHash,
      pin: pin,
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any);

    return res.status(201).json({
      success: true,
      message: 'تم تسجيل المستخدم بنجاح. تم إنشاء رمز تأكيد البريد الإلكتروني.',
      user: {
        id: userId,
        email,
        name,
        role: isFirstUser ? 'manager' : requestedRole,
        isEmailVerified: false
      },
      verificationToken
    });
  } catch (error: any) {
    console.error('Error in registration:', error);
    return res.status(500).json({
      success: false,
      error: 'فشل في تسجيل المستخدم الجديد'
    });
  }
});

/**
 * 3. POST /api/auth/refresh
 * Refresh Access Token using Refresh Token
 */
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshTokenInput = req.body.refreshToken || req.headers['x-refresh-token'];

    if (!refreshTokenInput) {
      return res.status(400).json({
        success: false,
        error: 'رمز التحديث (Refresh Token) مطلوب'
      });
    }

    const payload = TokenService.verifyRefreshToken(refreshTokenInput);
    if (!payload) {
      return res.status(401).json({
        success: false,
        error: 'رمز التحديث غير صالح أو انتهت صلاحيته'
      });
    }

    // Check session in DB
    const [session] = await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.id, payload.sessionId), eq(userSessions.isRevoked, false)));

    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'جلسة التحديث ملغاة أو منتهية الصلاحية'
      });
    }

    // Fetch user
    const [userRecord] = await db.select().from(users).where(eq(users.id, payload.id));
    if (!userRecord) {
      return res.status(401).json({
        success: false,
        error: 'المستخدم غير موجود'
      });
    }

    const userRole = userRecord.role || 'cashier';
    const defaultPerms = ROLE_DEFAULT_PERMISSIONS[userRole] || ROLE_DEFAULT_PERMISSIONS.cashier;

    // Issue new Access Token & Refresh Token (rotation)
    const newAccessToken = TokenService.generateAccessToken({
      id: userRecord.id,
      uid: userRecord.uid || userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRole,
      roleId: userRecord.roleId,
      companyId: userRecord.companyId,
      branchId: userRecord.branchId,
      permissions: defaultPerms,
      sessionId: session.id
    });

    const newRefreshToken = TokenService.generateRefreshToken(userRecord.id, session.id);
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update session record
    await db
      .update(userSessions)
      .set({
        refreshToken: newRefreshToken,
        expiresAt: newExpiresAt,
        updatedAt: new Date()
      })
      .where(eq(userSessions.id, session.id));

    return res.json({
      success: true,
      token: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (error: any) {
    console.error('Error refreshing token:', error);
    return res.status(500).json({
      success: false,
      error: 'فشل تجديد الجلسة'
    });
  }
});

/**
 * 4. POST /api/auth/logout
 * Revoke active session
 */
authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshTokenInput = req.body.refreshToken || req.headers['x-refresh-token'];
    const authHeader = req.headers.authorization;

    if (refreshTokenInput) {
      const payload = TokenService.verifyRefreshToken(refreshTokenInput);
      if (payload) {
        await db
          .update(userSessions)
          .set({ isRevoked: true, updatedAt: new Date() })
          .where(eq(userSessions.id, payload.sessionId));
      }
    }

    return res.json({
      success: true,
      message: 'تم تسجيل الخروج وإلغاء الجلسة بنجاح'
    });
  } catch (error: any) {
    console.error('Error logging out:', error);
    return res.status(500).json({
      success: false,
      error: 'فشل تسجيل الخروج'
    });
  }
});

/**
 * 5. GET /api/auth/me
 * Get current authenticated user details
 */
authRouter.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'غير مصرح به - يرجى تسجيل الدخول أولاً'
    });
  }

  return res.json({
    success: true,
    user: req.user
  });
});

/**
 * 6. GET /api/auth/sessions
 * List active user sessions
 */
authRouter.get('/sessions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'غير مصرح به' });
    }

    const sessionsList = await db
      .select({
        id: userSessions.id,
        ipAddress: userSessions.ipAddress,
        userAgent: userSessions.userAgent,
        isRevoked: userSessions.isRevoked,
        expiresAt: userSessions.expiresAt,
        createdAt: userSessions.createdAt
      })
      .from(userSessions)
      .where(and(eq(userSessions.userId, req.user.id), eq(userSessions.isRevoked, false)));

    return res.json({
      success: true,
      sessions: sessionsList
    });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return res.status(500).json({
      success: false,
      error: 'فشل في استرجاع الجلسات'
    });
  }
});

/**
 * 7. DELETE /api/auth/sessions/:id
 * Revoke specific session
 */
authRouter.delete('/sessions/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'غير مصرح به' });
    }

    const sessionId = req.params.id;
    await db
      .update(userSessions)
      .set({ isRevoked: true, updatedAt: new Date() })
      .where(and(eq(userSessions.id, sessionId), eq(userSessions.userId, req.user.id)));

    return res.json({
      success: true,
      message: 'تم إلغاء الجلسة المحددة بنجاح'
    });
  } catch (error: any) {
    console.error('Error revoking session:', error);
    return res.status(500).json({
      success: false,
      error: 'فشل إلغاء الجلسة'
    });
  }
});

/**
 * 8. POST /api/auth/forgot-password
 * Generate password reset token
 */
authRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: 'البريد الإلكتروني مطلوب' });
    }

    const [u] = await db.select().from(users).where(eq(users.email, email));
    if (!u) {
      // Return success anyway to avoid user enumeration
      return res.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجلاً لدينا، فقد تم إرسال تعليمات استعادة كلمة المرور.'
      });
    }

    const resetToken = TokenService.generateRandomToken(32);
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db
      .update(users)
      .set({
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
        updatedAt: new Date()
      } as any)
      .where(eq(users.id, u.id));

    return res.json({
      success: true,
      message: 'تم إنشاء رمز تعيين كلمة المرور بنجاح وترتيب إرساله.'
    });
  } catch (error: any) {
    console.error('Error in forgot-password:', error);
    return res.status(500).json({
      success: false,
      error: 'فشل في طلب إعادة تعيين كلمة المرور'
    });
  }
});

/**
 * 9. POST /api/auth/reset-password
 * Reset password using valid reset token
 */
authRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'الرمز وكلمة المرور الجديدة مطلوبان'
      });
    }

    const [u] = await db.select().from(users).where(eq((users as any).resetPasswordToken, token));

    if (!u || !(u as any).resetPasswordExpires || new Date((u as any).resetPasswordExpires) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'رمز إعادة التعيين غير صالح أو انتهت صلاحيته'
      });
    }

    const passwordHash = await TokenService.hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date()
      } as any)
      .where(eq(users.id, u.id));

    return res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.'
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return res.status(500).json({
      success: false,
      error: 'فشل في إعادة تعيين كلمة المرور'
    });
  }
});

/**
 * 10. POST /api/auth/send-verification-email
 * Send or generate email verification token
 */
authRouter.post('/send-verification-email', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'غير مصرح به' });
    }

    const verificationToken = TokenService.generateRandomToken(24);
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db
      .update(users)
      .set({
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        updatedAt: new Date()
      } as any)
      .where(eq(users.id, req.user.id));

    return res.json({
      success: true,
      message: 'تم إرسال رمز تأكيد البريد الإلكتروني.',
      verificationToken
    });
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return res.status(500).json({
      success: false,
      error: 'فشل في طلب تأكيد البريد الإلكتروني'
    });
  }
});

/**
 * 11. POST /api/auth/verify-email
 * Verify email address with token
 */
authRouter.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'رمز التأكيد مطلوب' });
    }

    const [u] = await db.select().from(users).where(eq((users as any).emailVerificationToken, token));

    if (!u || !(u as any).emailVerificationExpires || new Date((u as any).emailVerificationExpires) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'رمز تأكيد البريد الإلكتروني غير صالح أو انتهت صلاحيته'
      });
    }

    await db
      .update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
        updatedAt: new Date()
      } as any)
      .where(eq(users.id, u.id));

    return res.json({
      success: true,
      message: 'تم تأكيد البريد الإلكتروني بنجاح!'
    });
  } catch (error: any) {
    console.error('Error verifying email:', error);
    return res.status(500).json({
      success: false,
      error: 'فشل في تأكيد البريد الإلكتروني'
    });
  }
});
