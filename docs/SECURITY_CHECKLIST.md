# Security & Compliance Checklist for AD1 ERP

This document serves as a periodic verification checklist for developers and system administrators to maintain the production-grade security posture of the AD1 ERP system.

---

## 1. Firebase Authentication & Security Rules
Since Firebase keys in the frontend are public, security must be enforced on the backend / Firebase Console.
- [ ] **Firestore Security Rules**: Verify that default read/write access is disabled (`allow read, write: if false;` or strict auth/role checks).
- [ ] **Firebase Storage Rules**: Ensure users can only read/write their own assets (like logos or receipt attachments).
- [ ] **App Check**: Enable App Check with reCAPTCHA v3 or Play Integrity in the Firebase Console to enforce that API requests originate from genuine client builds (React/Electron/Capacitor).
- [ ] **Email/Password Controls**: Implement brute force detection or sign-in limits on the Firebase Console.

## 2. Server-Side Session Hardening (Express API)
- [ ] **No Raw Client Auth Reliance**: Never trust client-side Firebase Auth claims directly. All endpoints must check JWT authentication and role authorization via `TokenService` and `authenticate`/`requireRole` middlewares.
- [ ] **Environment Verification**: Keep `JWT_SECRET` and `REFRESH_SECRET` completely confidential. Never use public fallback secrets. Ensure keys are at least 64 bytes.
- [ ] **Rate Limiting**: Verify that `strictRateLimiter` is active on sensitive routes (auth, login, settings modification) to prevent brute-force attacks.
- [ ] **Error Sanitization**: Avoid printing detailed internal database stack traces or raw Drizzle queries in production API responses (sanitize via standard helper).

## 3. Database Security & Auditing
- [ ] **SQL Injection Prevention**: Always use Drizzle ORM's conditional operators (`eq`, `and`, `or`, `like`) rather than manual string concatenation in SQL queries.
- [ ] **Connection Confidentiality**: Verify that `DATABASE_URL` is set strictly via encrypted environment secrets and uses SSL where applicable.
- [ ] **Double-Entry Accounting Audits**: Run `verifyAccountingIntegrity()` periodically or automatically inside accounting reports to detect any unbalanced journal lines.
