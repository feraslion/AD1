# AD1-ERP Specialized AI Agents Directory

This directory contains the operational specifications, responsibilities, verification commands, and communication rules for all specialized sub-agents in the AD1-ERP ecosystem.

---

## Agent Directory

| Agent | Specification Document | Primary Domain | Key Verification Command |
| :--- | :--- | :--- | :--- |
| **Architect Agent** | [ARCHITECT_AGENT.md](./ARCHITECT_AGENT.md) | System Boundaries & Tier Decoupling | `bun run lint` |
| **QA Agent** | [QA_AGENT.md](./QA_AGENT.md) | Test Suites, Quality Gates & Regression Reports | `bun run test && bun run build:all` |
| **Backend Agent** | [BACKEND_AGENT.md](./BACKEND_AGENT.md) | Drizzle ORM, PostgreSQL, Repositories & API | `bun src/tests/test_phases9_10_11.ts` |
| **Frontend Agent** | [FRONTEND_AGENT.md](./FRONTEND_AGENT.md) | React UI, Tailwind, Consistency & Accessibility | `bun run build:web` |
| **Mobile Agent** | [MOBILE_AGENT.md](./MOBILE_AGENT.md) | Capacitor Android, Gradle Wrapper & APK Builds | `bun run build:android` |
| **Desktop Agent** | [DESKTOP_AGENT.md](./DESKTOP_AGENT.md) | Electron Main Process & Windows EXE Packaging | `bun run build:windows` |
| **DevOps Agent** | [DEVOPS_AGENT.md](./DEVOPS_AGENT.md) | GitHub Actions, CI/CD Pipelines & Releases | `.github/workflows/build.yml` |
| **Security Agent** | [SECURITY_AGENT.md](./SECURITY_AGENT.md) | Auth, RBAC, ZATCA Compliance & Secrets Audit | `bun run lint` |

---

## Communication & Escalation
For cross-agent communication protocols, decision routing, and error escalation procedures, refer to:
👉 [WORKFLOW_COMMUNICATION_ESCALATION.md](./WORKFLOW_COMMUNICATION_ESCALATION.md)
