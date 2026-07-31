# Lead ERP Software Architect & Quality Standards (AGENTS.md)

## 1. Core Principles & Philosophy
- **Architectural Rigor**: Maintain a clean multi-tier architecture: UI Components → Services / Core API → Repository Layer → Database / Persistence.
- **Zero Business Logic in UI**: React components must strictly handle UI rendering, user interaction, and layout. All domain rules, calculations, approvals, and validations belong in the Service and Repository layers.
- **Dry & Reusable**: Avoid duplicating business logic across components or API endpoints.
- **Production-Grade Reliability**: Every modification must preserve complete system integrity (General Ledger balance, ZATCA tax compliance, inventory valuation consistency).

---

## 2. Lead Agent & Specialist Sub-Agent Workflow
When executing complex updates or repository maintenance, coordinate work using specialized sub-roles:
1. **Architect Agent**: Audits module boundaries, interfaces, technical decisions, and layer decoupling before any code edits (`docs/agents/ARCHITECT_AGENT.md`).
2. **QA Agent**: Executes lint checks (`bun run lint`), integration test suites (`bun run test`), multi-builds (`bun run build:all`), and regression analysis (`docs/agents/QA_AGENT.md`).
3. **Backend Agent**: Maintains Drizzle ORM schemas, PostgreSQL connections, REST endpoints, and core ERP business logic (`docs/agents/BACKEND_AGENT.md`).
4. **Frontend Agent**: Maintains React 18 UI components, Tailwind CSS styling, visual consistency, and accessibility with zero domain logic in views (`docs/agents/FRONTEND_AGENT.md`).
5. **Mobile Agent**: Maintains Capacitor Android configurations, Gradle Wrapper integrity, and APK builds (`docs/agents/MOBILE_AGENT.md`).
6. **Desktop Agent**: Maintains Electron main process, window management, and Windows EXE packaging (`docs/agents/DESKTOP_AGENT.md`).
7. **DevOps Agent**: Maintains GitHub Actions workflows (`.github/workflows/build.yml`), CI/CD pipelines, and release management (`docs/agents/DEVOPS_AGENT.md`).
8. **Security Agent**: Reviews authentication, RBAC role permissions, secret protection, and ZATCA / financial compliance (`docs/agents/SECURITY_AGENT.md`).

For detailed workflow rules and communication protocols, see:
- Configuration: `/.agent/agents.json` and `/.agent/workflow.json`
- Workflow Guide: `/workflow/ENGINEERING_WORKFLOW.md` and `/workflow/gates.json`
- Documentation Index: `/docs/agents/INDEX.md`

---

## 3. Engineering Gate (Pre-Implementation & Release Checklist)
Before merging or executing code changes, the workspace must satisfy:
1. **Build Verification**: `bun run build` completes with zero errors.
2. **Type Safety**: TypeScript compiler check passes with no blocking type errors (`bun run lint` / `bun run typecheck`).
3. **Database & Schema Integrity**: Schema modifications are synced with migrations, auto-migration mechanisms (`initSchema.ts`), and types.
4. **Test Coverage**: Integration test suites (`bun run test`) pass successfully without regressions.
5. **Cross-Platform Compatibility**: Electron builder config (`electron-builder.yml`) and Android Gradle wrapper (`android/gradle/wrapper/gradle-wrapper.jar`) are intact (`bun run build:all`).
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
