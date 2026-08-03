## 2026-03-31 - [Token Service & RBAC Hardening]
**Vulnerability:** Default administrative fallback bypass and unprotected endpoints.
**Learning:** Hardcoded fallback secrets for token signing and automatic user log-ins to '001' are highly vulnerable if they execute in production environments. Additionally, system endpoints (such as backup/restore) can be completely bypassed if RBAC middleware is omitted from route configurations.
**Prevention:** Always restrict default configurations and automatic administrative logins to non-production environments (`process.env.NODE_ENV !== 'production'`), throw error on missing credentials in production, and enforce explicit role-based access checks (`authorize`) across all admin/system routers.
