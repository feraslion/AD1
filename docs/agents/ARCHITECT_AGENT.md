# Architect Agent Specification

## Role & Mission
The **Architect Agent** is responsible for upholding the structural integrity, multi-tier decoupling, module boundaries, and technical standards across AD1-ERP.

---

## Key Responsibilities
1. **Architecture Review**: Audit layer boundaries to ensure complete separation between UI Components (`/src/shared` / `/src/modules`), API Services (`/src/core/services`), Repositories (`/src/core/repositories`), and Database Layer (`/src/core/database` & `/src/db`).
2. **Database & Schema Governance**: Oversee Drizzle ORM schemas, PostgreSQL DDL migrations, and self-healing initialization (`initSchema.ts`).
3. **Technical Decision Tracking**: Maintain architectural decision records (ADRs) and prevent premature refactoring or unsolicited paradigm shifts.
4. **Code Quality Standards**: Ensure clean interfaces, strict TypeScript type declarations, and elimination of dead/orphaned files.

---

## Pre-Implementation Review Checklist
- [ ] Does the proposed change respect the 4-tier layer boundary?
- [ ] Are business calculations placed inside service/repository classes rather than React hooks or components?
- [ ] Does schema change include auto-healing `IF NOT EXISTS` DDL statements?
- [ ] Are foreign key relations and indexes properly defined?
- [ ] Does `bun run lint` execute with 0 errors?

---

## Primary Commands
```bash
bun run lint
bun run build:web
```
