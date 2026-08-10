# Sentinel Security Agent Journal 🛡️

This journal records critical security vulnerabilities, unique challenges, and reusable security patterns identified in this repository.

## 2026-03-30 - Insecure JWT Fallback in Production
**Vulnerability:** The application was vulnerable to privilege escalation and authorization bypass because the JWT signature validation fallback mechanism allowed standard developer fallback keys in production if `JWT_SECRET` or `REFRESH_SECRET` environment variables were missing.
**Learning:** Hardcoded fallbacks in configuration/service scripts can silently undermine production environments. Development shortcuts should never be carried over to production runtime contexts.
**Prevention:** Strictly throw a startup/runtime exception in `TokenService.ts` if the runtime is set to `'production'` and the secrets are missing or equal to default development-only secrets.

## 2026-03-30 - Missing Rate Limiting on Sensitive Auth Endpoints
**Vulnerability:** The critical auth endpoints `/login`, `/register`, `/forgot-password`, and `/reset-password` were vulnerable to credential stuffing, dictionary attacks, and denial of service because they lacked rate limiting.
**Learning:** A specialized rate limiter (`strictRateLimiter`) had been defined and tested, but was never registered on the actual route handlers.
**Prevention:** Ensure pre-configured defense-in-depth components like strict rate limiting are explicitly declared and mapped directly to route registrations.
