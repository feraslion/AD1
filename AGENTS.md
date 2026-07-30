# Lead ERP Software Architect & Quality Standards (AGENTS.md)

## 1. Core Principles & Philosophy
- **Architectural Rigor**: Maintain a clean multi-tier architecture: UI Components → Services / Core API → Repository Layer → Database / Persistence.
- **Zero Business Logic in UI**: React components must strictly handle UI rendering, user interaction, and layout. All domain rules, calculations, approvals, and validations belong in the Service and Repository layers.
- **Dry & Reusable**: Avoid duplicating business logic across components or API endpoints.
- **Production-Grade Reliability**: Every modification must preserve complete system integrity (General Ledger balance, ZATCA tax compliance, inventory valuation consistency).

---

## 2. Lead Agent & Specialist Sub-Agent Workflow
When executing complex updates or repository maintenance, coordinate work using specialized sub-roles:
1. **Architect Agent**: Audits module boundaries, interfaces, and layer decoupling before any code edits.
2. **Database & Schema Agent**: Ensures PostgreSQL schema alignment, auto-healing DDL migrations (`IF NOT EXISTS`), and seed data consistency.
3. **Bugfix & Service Agent**: Fixes service/repository logic using minimal, targeted, surgical patches.
4. **Test & Verification Agent**: Executes unit and integration test suites (`bun run test`) and verifies zero regressions.
5. **UI & Accessibility Agent**: Ensures clean presentation, responsiveness, and zero domain logic inside React components.
6. **CI/CD & Multi-Platform Agent**: Maintains cross-platform pipelines (`electron-builder.yml`, GitHub Workflows, Capacitor Android/Gradle Wrapper).

---

## 3. Engineering Gate (Pre-Implementation & Release Checklist)
Before merging or executing code changes, the workspace must satisfy:
1. **Build Verification**: `npm run build` completes with zero errors.
2. **Type Safety**: TypeScript compiler check passes with no blocking type errors (`npm run lint`).
3. **Database & Schema Integrity**: Schema modifications are synced with migrations, auto-migration mechanisms (`initSchema.ts`), and types.
4. **Test Coverage**: Unit and integration test suites pass successfully without regressions.
5. **Cross-Platform Compatibility**: Electron builder config (`electron-builder.yml`) and Android Gradle wrapper (`.gitignore` exceptions) are intact.
6. **No Dead/Unused Code**: No orphan files, unused dependencies, or circular imports.

---

## 4. Code Review Gate
Any change or Pull Request must satisfy:
- **Redundancy & Architecture**: Eliminates duplication and strengthens modularity without introducing technical debt.
- **API & Data Compatibility**: Does not break existing REST endpoints, database schemas, or client state contracts.
- **Performance & Scalability**: Optimized queries, zero unbounded memory leaks, and fast execution paths.
- **Safety**: Robust error handling, graceful fallback for missing database tables, and proper environment configuration.

---

## 5. Phase-Based Quality Workflow
1. Inspect workspace structure and identify architectural or code debt.
2. Formulate targeted, prioritized adjustments.
3. Apply changes cleanly in service/repository/UI layers.
4. Verify with `compile_applet`, `lint_applet`, and test scripts.
5. Confirm stability before proceeding to the next objective.
