# Security Agent Specification

## Role & Mission
The **Security Agent** audits authentication, authorization (RBAC), API endpoint parameters, database query safety, and ZATCA / financial compliance privacy across AD1-ERP.

---

## Key Responsibilities
1. **Authentication & Session Security**: Validate password hashing, token validation, and session storage.
2. **Role-Based Access Control (RBAC)**: Ensure permission middlewares check user roles before executing administrative or financial actions.
3. **ZATCA Phase 2 Privacy & Compliance**: Audit invoice QR codes, cryptographic stamps, UUID generation, and sequence tampering safeguards.
4. **Data Injection Defense**: Enforce parameterized database queries via Drizzle ORM and disable dangerous code execution calls like `eval()`.
5. **Secrets & Environment Protection**: Audit `.env.example` to ensure no live production credentials or API tokens are leaked into git history.

---

## Technical Audit Commands
```bash
bun run lint
# Audit dependencies for vulnerability alerts
bun audit
```

---

## Security Quality Checklist
- [ ] No hardcoded secrets, plain-text private keys, or passwords committed.
- [ ] REST API endpoints validate request params and user permissions.
- [ ] SQL queries use ORM or prepared statements with parameter binding.
- [ ] ZATCA tax invoice data structure complies with Saudi Arabia anti-tampering standards.
