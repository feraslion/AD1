## 2025-05-18 - Authentication Bypass via Legacy User ID Fallback in Middleware
**Vulnerability:** The authentication middleware in `src/core/server/middleware/auth.ts` contained a legacy fallback that accepted raw user IDs or employee code strings in the `Authorization: Bearer <token>` header, bypassing JWT signature verification.
**Learning:** Legacy development fallbacks for test users or cashier codes can linger in secondary middleware files even after primary server authentication is hardened.
**Prevention:** Strictly enforce `TokenService.verifyAccessToken` and reject non-JWT strings across all authentication middleware handlers.
