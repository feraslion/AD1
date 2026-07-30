# AD1-ERP Multi-Agent Engineering Workflow

## Overview
The AD1-ERP engineering process is governed by a strict **Multi-Agent Quality Gate System**. Every modification, pull request, or release must pass through specialized AI agents and verification checkpoints to guarantee zero regression in accounting math, multi-currency conversions, inventory valuation, or cross-platform builds.

---

## The 4-Step Mandatory Review Sequence

Every code change must sequentially execute and pass through:

1. **Architect Review**: Audits domain boundaries, multi-tier layer separation, and database schema compatibility.
2. **Security Check**: Audits authentication gates, RBAC permissions, secret handling, and input sanitization.
3. **QA Tests**: Executes linting (`bun run lint`) and integration test suites (`bun run test`).
4. **Build Verification**: Compiles Web, Desktop (Windows EXE), and Mobile (Android APK) packages (`bun run build:all`).

---

## Pre-Merge Merge Criteria

Before any branch or pull request can be merged into `main`, all five checks must be strictly satisfied:

| Check | Command | Passing Condition |
| :--- | :--- | :--- |
| **Lint** | `bun run lint` | TypeScript type-checker passes with 0 errors |
| **Tests** | `bun run test` | All Phase 8–15 test suites pass with 0 failures |
| **Web Build** | `bun run build:web` | Production Vite build & server esbuild complete |
| **Windows Build** | `bun run build:windows` | Electron-builder generates `release/windows/*.exe` |
| **Android Build** | `bun run build:android` | Gradle assembles `android/app/build/outputs/apk/release/*.apk` |

---

## Stage Responsibilities & Transitions

```
[Change Request]
       │
       ▼
1. Architect Agent ──► Schema & Design Review
       │
       ▼
2. Implementation (Backend / Frontend / Mobile / Desktop Agent)
       │
       ▼
3. Security Agent ──► Auth & RBAC Audit
       │
       ▼
4. QA Agent ───────► Run Lint, Tests & Builds
       │
       ▼
5. DevOps Agent ────► GitHub Actions CI/CD & Artifact Release
```

---

## Governance Rules
- **Zero Business Logic in UI**: React components handle presentation only. All accounting and business logic resides in Services / Repositories.
- **Auto-Healing Schema**: Database migrations use `IF NOT EXISTS` DDL guards to support seamless execution across environments.
- **Cross-Platform Integrity**: Android Gradle wrapper (`gradle-wrapper.jar`) and Electron main process scripts must remain committed and verified.
