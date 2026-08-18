## 2025-05-20 - Unauthenticated User ID Fallback in Auth Middleware
**Vulnerability:** The `authenticate` middleware in `src/core/server/middleware/auth.ts` fell back to looking up users directly by `users.id` if `TokenService.verifyAccessToken(token)` returned `null`. An attacker could pass `Authorization: Bearer <user_id>` (such as `Bearer 001`) to impersonate any user without providing a valid signed JWT.
**Learning:** Legacy fallback authentication patterns kept for convenience or backwards compatibility can introduce critical access control bypasses if unverified inputs are trusted.
**Prevention:** Always require cryptographically signed and verified tokens for Bearer authentication and remove plain-identifier fallback mechanisms in production middleware.
