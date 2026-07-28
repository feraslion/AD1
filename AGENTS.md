# Lead ERP Software Architect & Quality Standards (AGENTS.md)

## 1. Core Principles & Philosophy
- **Architectural Rigor**: Maintain a clean multi-tier architecture: UI Components → Services / Core API → Repository Layer → Database / Persistence.
- **Zero Business Logic in UI**: React components must strictly handle UI rendering, user interaction, and layout. All domain rules, calculations, approvals, and validations belong in the Service and Repository layers.
- **Dry & Reusable**: Avoid duplicating business logic across components or API endpoints.
- **Production-Grade Reliability**: Every modification must preserve complete system integrity (General Ledger balance, ZATCA tax compliance, inventory valuation consistency).

---

## 2. Engineering Gate (Pre-Implementation & Release Checklist)
Before merging or executing code changes, the workspace must satisfy:
1. **Build Verification**: `npm run build` completes with zero errors.
2. **Type Safety**: TypeScript compiler check passes with no blocking type errors.
3. **Linter Standard**: Code passes `npm run lint` cleanly.
4. **Database & Schema Integrity**: Schema modifications are synced with migrations, auto-migration mechanisms, and types.
5. **Test Coverage**: Unit and integration test suites pass successfully without regressions.
6. **No Dead/Unused Code**: No orphan files, unused dependencies, or circular imports.

---

## 3. Code Review Gate
Any change or Pull Request must satisfy:
- **Redundancy & Architecture**: Eliminates duplication and strengthens modularity without introducing technical debt.
- **API & Data Compatibility**: Does not break existing REST endpoints, database schemas, or client state contracts.
- **Performance & Scalability**: Optimized queries, zero unbounded memory leaks, and fast execution paths.
- **Safety**: Robust error handling, graceful fallback for missing database tables, and proper environment configuration.

---

## 4. Phase-Based Quality Workflow
1. Inspect workspace structure and identify architectural or code debt.
2. Formulate targeted, prioritized adjustments.
3. Apply changes cleanly in service/repository/UI layers.
4. Verify with `compile_applet`, `lint_applet`, and test scripts.
5. Confirm stability before proceeding to the next objective.
