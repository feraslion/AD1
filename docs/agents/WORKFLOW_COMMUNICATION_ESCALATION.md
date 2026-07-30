# Multi-Agent Communication, Decision & Escalation Protocols

## Overview
To maintain order and prevent conflicting changes across AD1-ERP's full-stack architecture, all 8 specialized agents communicate using defined channels, structured reviews, and explicit escalation paths.

---

## Communication Channels & Handshake Sequence

```
[User / Feature Request]
           │
           ▼
    Architect Agent (Boundary & Schema Review)
           │
           ├──► Backend Agent (ORM, DB, Services)
           ├──► Frontend Agent (React Views, Tailwind)
           ├──► Mobile Agent (Capacitor Android)
           └──► Desktop Agent (Electron Packaging)
           │
           ▼
    Security Agent (RBAC & Auth Verification)
           │
           ▼
       QA Agent (Lint, Test Suite & Multi-Build Execution)
           │
           ▼
    DevOps Agent (GitHub Actions & Artifact Release)
```

---

## Agent Handoff Protocol

### 1. Architect to Domain Implementation
When a feature is introduced:
- Architect Agent defines schema changes and service interfaces.
- Backend, Frontend, Mobile, or Desktop Agent implements changes according to the architectural spec.

### 2. Implementation to Security
- Implementer submits code changes.
- Security Agent reviews permissions, token validity, and parameter sanitization.

### 3. Security to QA Verification
- Security Agent approves access controls.
- QA Agent executes `bun run lint`, `bun run test`, and `bun run build:all`.

### 4. QA to DevOps Release
- QA Agent confirms 100% test pass and zero build regressions.
- DevOps Agent triggers GitHub Actions release workflow and stores artifacts.

---

## Escalation Matrix

When an issue occurs, agents follow this escalation hierarchy:

| Issue Type | First Responder | Escalation Target | Trigger Condition |
| :--- | :--- | :--- | :--- |
| **Schema or DDL Failure** | Backend Agent | Architect Agent | Table or column migration error (`DrizzleQueryError`) |
| **Test Suite Regression** | QA Agent | Backend Agent / Frontend Agent | `bun run test` failure in Phase 8-15 |
| **Windows Build Failure** | Desktop Agent | DevOps Agent | `electron-builder` fail or packaging error |
| **Android Gradle Failure** | Mobile Agent | DevOps Agent | `gradlew assembleRelease` error or missing wrapper |
| **Permission/Auth Error** | Security Agent | Architect Agent | RBAC access mismatch or token vulnerability |

---

## Resolution Rules
1. **Never Revert Working Test Suites**: If a test fails, fix the underlying logic; do not disable or delete verification tests.
2. **Preserve Auto-Healing DDL**: Database migrations must always include `IF NOT EXISTS` or column fallback logic to guarantee seamless startup across all environments.
3. **No Unsolicited API Changes**: Any change breaking existing REST endpoints or database state contracts requires prior Architect Agent approval.
