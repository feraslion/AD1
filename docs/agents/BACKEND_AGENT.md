# Backend Agent Specification

## Role & Mission
The **Backend Agent** is responsible for the core server architecture, Drizzle ORM models, PostgreSQL database queries, self-healing DDL scripts, API endpoints (`server.ts`), and ERP business logic repositories.

---

## Key Responsibilities
1. **Drizzle ORM & Database Schemas**: Maintain table definitions in `/src/db/schema.ts` and `/src/core/database/schema.ts`.
2. **Self-Healing Schema Migrations**: Maintain `/src/core/database/initSchema.ts` with `IF NOT EXISTS` DDL guards and column additions.
3. **Repository Layer**: Maintain domain data operations (`AccountRepository`, `InventoryRepository`, `InvoiceRepository`, `CurrencyRepository`, `ExpenseRepository`, `TreasuryRepository`, etc.).
4. **API Service Tier**: Maintain Express HTTP routes in `server.ts` with proper error handling and JSON responses.
5. **Base Data Seeding**: Maintain `seedEnterpriseData.ts` to ensure default company, warehouses (`wh_main`), chart of accounts, and base currencies exist dynamically.

---

## Technical Verification Commands
```bash
bun src/tests/test_phase8_currency.ts
bun src/tests/test_phases9_10_11.ts
bun src/tests/test_phases12_13_14_15.ts
```

---

## Quality Checklist
- [ ] New database tables/columns are added to both Drizzle schema files and `initSchema.ts`.
- [ ] Queries use parameterization to prevent SQL injection vulnerabilities.
- [ ] Financial calculations adhere to double-entry general ledger balance rules.
- [ ] Fallback mock data in repository catch blocks handles missing database tables gracefully.
