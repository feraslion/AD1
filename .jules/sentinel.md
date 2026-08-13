# Sentinel Security Journal 🛡️

This journal records critical security-focused learnings and vulnerability preventions identified within the codebase.

## 2026-03-01 - Missing RBAC Authorization Guard on Sensitive System Routes
**Vulnerability:** Sensitive system endpoints in `src/core/server/routes/v1/system.routes.ts` handling data backups, database restores, audit trail logs, and workflow approval configurations lacked the `authorize` RBAC middleware. This allowed low-privilege authenticated users (such as `cashier` or `inventory` staff) to retrieve logs, trigger backups, or modify critical approvals.
**Learning:** Decoupling route handlers into separate files can sometimes lead to missing middleware application if the parent router or sub-routers are not audited systematically. While authentication was applied globally to `/api`, granular RBAC checks must be explicitly defined for every new router.
**Prevention:** Always verify that critical, administrative, and configuration endpoints explicitly apply the `authorize(...)` middleware, ensuring least-privilege access controls are enforced.
