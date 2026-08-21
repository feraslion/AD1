## 2025-05-20 - Global Search Authorization Bypass Prevention
**Vulnerability:** In `src/core/server/routes/v1/search.routes.ts`, `isManager` evaluated `!req.user || req.user.role === 'manager' || req.user.role === 'admin'`, which treated any request with a missing or unauthenticated `req.user` context as a manager role, bypassing module permission checks.
**Learning:** Default-grant fallbacks or missing check logic in boolean expressions like `!req.user` can grant elevated manager permissions to unauthenticated or malformed contexts.
**Prevention:** Always ensure `req.user` existence and explicitly verify user roles (`req.user?.role === 'manager'`) instead of checking for falsy user objects when setting role bypass flags.
