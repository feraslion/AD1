# Sentinel Security Agent Journal

## 2025-03-05 - [Unprotected Administrative System Routes]
**Vulnerability:** Core system endpoints like database backup, restore, workflows, and audit logs inside `src/core/server/routes/v1/system.routes.ts` lacked RBAC authorization checks. Any authenticated user (including low-privilege cashier roles) could trigger backup generation, restore raw databases, or manipulate workflows.
**Learning:** Middlewares at the router group level authenticate requests, but do not automatically apply authorization / role-based limits. Each endpoint or sub-router must explicitly specify its required permissions or roles to enforce the principle of least privilege.
**Prevention:** Always apply the `authorize` RBAC middleware on any system, configuration, or administrative route to enforce role restrictions (e.g., limiting to 'manager' or 'accountant' roles) before processing requests.
