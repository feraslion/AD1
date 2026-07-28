# AD1 ERP - Phase 1: Architectural Audit and Repository Review

## 1. Architectural Overview

The AD1 project is a full-featured Enterprise POS & ERP system structured as a decoupled, multi-layered system designed for scalability, performance, and compliance.

### 🏛️ System Layers

#### 1. Presentation Layer (React + Vite + TypeScript)
- **Files Location:** Located under `src/modules/` (e.g., `accounting`, `sales`, `inventory`, `purchases`, `treasury`, `expenses`) and `src/shared/components/`.
- **Core Technology:** Built on React 19, Tailwind CSS v4, Lucide Icons, and Motion (framer-motion).
- **Decoupling:** Business logic is primarily isolated inside repository services (`src/core/repositories/`) and backend services, while local UI interactions are managed reactively.

#### 2. Application/Service Layer (Node.js Express + TSX)
- **Files Location:** `server.ts` (API Boundaries & Middleware) and `src/core/services/` / `src/services/`.
- **Responsibility:** Implements global route handlers, CORS/security middleware, and business workflows (such as currency conversions, POS checkout sessions, and ZATCA Phase 1 & 2 compliance).

#### 3. Domain Layer (Drizzle Schema & Business Logic)
- **Files Location:** `src/db/schema.ts` (re-exported by `src/core/database/schema.ts`) and `src/core/services/JournalEngine.ts`.
- **Domain Invariants:** Strict double-entry accounting checks (Sum Debits = Sum Credits), currency rates historic conversions, and active account posting assertions.

#### 4. Infrastructure/Database Layer (Drizzle ORM + PostgreSQL)
- **Files Location:** `src/core/database/index.ts` and `drizzle/`.
- **Responsibility:** Handles raw database connectivity pooling (`pg` Pool), schema migration orchestration, and connection resilient parameter pooling.

---

## 2. Key Audited Findings & Technical Debt

1. **Security (Audit - Secure API Error Boundaries):**
   - Standardized and secured central error parsing inside the `sendError` global response boundary in `server.ts`. Raw Postgres or engine backtraces are strictly prevented from leaking to client-facing web applications.
2. **Performance (Audit - DB Joins):**
   - Shunted large array operations (such as multi-million transaction arrays in `getFinancialStatements`) to SQL Inner Joins directly at the PostgreSQL layer inside `ReportsRepository.ts`.
3. **Robustness (Audit - Offline Queue & Post Checks):**
   - The point-of-sale offline queue in `offlineQueue.ts` and journal validations inside `JournalEngine.ts` are verified and operate as robust domain-level rules.
4. **Automation workflows:**
   - GitHub Actions workflow (`.github/workflows/jules-automations.yml`) is correctly implemented and aligned with upstream without any merge conflicts.

---

## 3. Next Phases Recommendations

- **Phase 2 (Database Migrations):** Run standard migrations as database requirements expand.
- **Phase 3 (Unit Testing):** Integrate Vitest or Jest to continuously assert double-entry accounting invariants.
- **Phase 4 (Nuyen/Odoo-like Feature Depth):** Continuously extend the modular design to include HR, Payroll, and CRM.
