## 2025-05-18 - System API Routes Authorization Hardening
**Vulnerability:** System API endpoints under `/api/v1/system/*` (including workflow rules/approvals, audit logs, backup export/restore, and notifications) were exposed without RBAC authorization middleware (`authorize(...)`).
**Learning:** Router endpoints mounted under authenticated base routers (like `/api`) still require explicit route-level RBAC middleware checks (`authorize`) to enforce role-based access control, preventing unprivileged users (e.g., cashiers) from accessing administrative workflow rules or system backups.
**Prevention:** Always declare role-based authorization middleware (`authorize(['manager', ...])`) explicitly on all sub-router handlers in Express v1 API modules.
