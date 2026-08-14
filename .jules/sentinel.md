## 2025-08-14 - Authorization Bypass via Default Truthy Negation
**Vulnerability:** In `search.routes.ts`, `isManager` was defined as `!req.user || req.user.role === 'manager' || req.user.role === 'admin'`, which evaluated to `true` when `req.user` was undefined, granting unauthenticated requests manager access across search queries.
**Learning:** Checking for falsy user objects (`!req.user`) in role predicate logic creates catastrophic authorization bypasses if middleware allows requests without populating `req.user`.
**Prevention:** Always use safe optional chaining and explicit equality checks (`req.user?.role === 'manager'`) for role and permission assignments.
