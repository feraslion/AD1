## 2025-05-18 - Search Authorization Bypass & PDF DOM XSS Sanitization

**Vulnerability:** Unauthenticated search requests evaluates `!req.user` as `true` in `search.routes.ts`, granting manager privileges. In `pdfGenerator.ts`, unescaped dynamic store and invoice text were interpolated into `container.innerHTML`, creating a DOM XSS vector.

**Learning:** Combining negation logic (`!req.user`) in privilege checks (e.g., `!req.user || req.user.role === 'manager'`) accidentally treats unauthenticated contexts as elevated administrative roles. Similarly, setting `innerHTML` with unsanitized user inputs in DOM PDF renderers creates client XSS risks.

**Prevention:** Always explicitly evaluate role properties (`req.user?.role === 'manager'`) and wrap all dynamic text strings in `escapeHtml` before inserting them into HTML string templates or `innerHTML`.
