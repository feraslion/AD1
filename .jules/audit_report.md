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

## 3. Release Validation and Seeding Configurations

### 🧪 Automated ERP Test Suites
We have developed and added three core test modules under `src/tests/` to perform strict verification across all ERP logic modules:
- **`src/tests/test_phase8_currency.ts`:** Verifies currency exchange rate settings, historic currency conversions, and rate tables.
- **`src/tests/test_phases9_10_11.ts`:** Verifies inventory adjustments, stock movements, sales, POS checkouts, purchase orders, customer ledgers, and supplier transactions.
- **`src/tests/test_phases12_13_14_15.ts`:** Verifies financial reporting engines (P&L, Trial Balance, Balance Sheet), double-entry accounting audits, automated workflows, and database backups.

### 🌱 Seeding & Initial Database State
We implemented and exported a global database seeder `seedEnterpriseData()` inside `src/core/database/initSchema.ts` that ensures the automatic creation of:
1. **The default Company (`company-1`)**
2. **The main Warehouse (`wh_main`)**
3. **Default accounts** (Cash, Bank, Accounts Receivable, Inventory, etc.)
4. **Default currencies** (SAR, USD, TRY) with conversion rates.

### 👷 Platform Build Targets
Configured the automated platform builder scripts in `package.json` to produce build artifacts:
- **Web Build:** Generates single-page-app bundled resources in `dist/`.
- **Windows Build:** Generates standalone deployment setup executables in `release/windows/AD1-ERP_Setup.exe`.
- **Android Build:** Generates verified APK files in `android/app/build/outputs/apk/app-release.apk`.
