## 2026-03-01 - Development Administrator Fallback Authentication Bypass
**Vulnerability:** Express authenticate middlewares default to falling back to an administrator master user (ID '001') if no authentic session token is present. This bypass is active regardless of the execution environment (including production).
**Learning:** The fallback was added to simplify development and testing sessions, but without a condition verifying the environment, it introduces a severe security risk where any guest is automatically authenticated as a manager.
**Prevention:** Ensure all development/testing-only convenience fallbacks are explicitly guarded by checking that `process.env.NODE_ENV !== 'production'`.
