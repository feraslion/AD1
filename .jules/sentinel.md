## 2025-05-18 - System Routes RBAC Hardening
**Vulnerability:** Administrative routes in `src/core/server/routes/v1/system.routes.ts` (`/backup/export`, `/backup/restore`, `/audit-logs`, `/workflows/*`) lacked role authorization middleware.
**Learning:** Router modules created during decoupling might omit `authorize` guards if added after core auth middleware, exposing administrative capabilities to low-privileged roles if not guarded per route handler.
**Prevention:** Always wrap administrative endpoints in domain-specific routers with `authorize(['manager', ...])` or `requireRole(...)` middleware.
