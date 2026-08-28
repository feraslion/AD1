## 2025-05-18 - Missing Authorization Guard on Expense API Endpoints
**Vulnerability:** Unprotected REST endpoints in `expenses.routes.ts` (`GET /categories`, `GET /requests`, `POST /requests`, `GET /reports`) allowed unauthenticated or low-privileged callers to read/create expense requests and access sensitive expense reports.
**Learning:** Endpoints created during early module iteration lacked the `authorize(...)` RBAC middleware wrapper that other routes possessed.
**Prevention:** Always mandate RBAC middleware on all API routes during endpoint definition and enforce authorization checks in route unit tests.
