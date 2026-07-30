# AD1-ERP GitHub Agent Workflow & Automation

This document outlines the GitHub integration and automated routing system for AD1-ERP's specialized multi-agent engineering architecture.

---

## 1. Multi-Agent Ecosystem Overview

AD1-ERP utilizes an 8-agent specialized architecture configured in `/.agent/agents.json` and `/.agent/workflow.json`:

1. **Architect Agent** (`agent:architect` / `agent:database`): Reviews system boundaries, schema DDL, and layer decoupling.
2. **QA Agent** (`agent:qa`): Manages test suites (`bun run test`), type safety (`bun run lint`), and regression reports.
3. **Backend Agent** (`agent:backend`): Maintains Drizzle ORM, PostgreSQL connection pools, API endpoints, and business logic repositories.
4. **Frontend Agent** (`agent:frontend`): Maintains React 18, Tailwind CSS, component modularity, and accessibility.
5. **Mobile Agent** (`agent:mobile`): Maintains Capacitor Android integration, Gradle wrapper, and APK release builds.
6. **Desktop Agent** (`agent:desktop`): Maintains Electron main process, `electron-builder` configuration, and Windows EXE installers.
7. **DevOps Agent** (`agent:devops`): Maintains GitHub Actions workflows (`.github/workflows/`), CI/CD automation, and release artifacts.
8. **Security Agent** (`agent:security`): Audits authentication, RBAC authorization, secret safety, and ZATCA / financial compliance.

---

## 2. GitHub Issue Router Automation (`.github/workflows/agent-router.yml`)

When an issue is opened or edited on GitHub, the `AD1 Agent Issue Router` automatically analyzes the title, description, and template metadata to assign specialized agent labels:

| Category / Keywords | Assigned Label | Primary Responsible Agent |
| :--- | :--- | :--- |
| `database`, `migration`, `schema`, `sql`, `ddl`, `table`, `column` | `agent:database` | Architect & Backend Agents |
| `react`, `ui`, `component`, `tailwind`, `layout`, `view`, `frontend` | `agent:frontend` | Frontend Agent |
| `api`, `backend`, `express`, `endpoint`, `service`, `repository`, `drizzle` | `agent:backend` | Backend Agent |
| `test`, `failure`, `unit`, `integration`, `qa`, `bug` | `agent:qa` | QA Agent |
| `apk`, `android`, `capacitor`, `gradle`, `mobile` | `agent:mobile` | Mobile Agent |
| `electron`, `exe`, `windows`, `desktop`, `installer` | `agent:desktop` | Desktop Agent |
| `ci`, `workflow`, `build`, `actions`, `pipeline`, `devops` | `agent:devops` | DevOps Agent |
| `security`, `auth`, `rbac`, `token`, `permission`, `secret`, `zatca` | `agent:security` | Security Agent |

---

## 3. Pull Request Automated Agent Review (`.github/workflows/pr-agent-review.yml`)

When a pull request is submitted or updated, the PR review workflow performs two key operations:

### A. Automatic File Path Analysis & Agent Routing
Detects modified files and attaches relevant agent labels:
- `src/db/**`, `src/core/database/**`, `drizzle/**` ➔ `agent:database`
- `src/shared/**`, `src/modules/**`, `src/components/**`, `index.html` ➔ `agent:frontend`
- `src/core/services/**`, `src/core/repositories/**`, `server.ts` ➔ `agent:backend`
- `src/tests/**` ➔ `agent:qa`
- `android/**`, `capacitor.config.json` ➔ `agent:mobile`
- `electron/**`, `electron-builder.yml` ➔ `agent:desktop`
- `.github/**`, `package.json` ➔ `agent:devops`
- Security or RBAC files ➔ `agent:security`

### B. Complete Quality Gate Execution
The runner spins up a live PostgreSQL container service and validates:
1. **Linting**: `bun run lint` (0 TypeScript errors required).
2. **Test Suite**: `bun run test` (100% passing rate across multi-currency, inventory, sales, purchases, POS, customer/supplier ledgers, and financial reports).
3. **Web Build**: `bun run build:web`
4. **Windows Installer**: `bunx electron-builder --win --x64 -c.publish=never`
5. **Android APK**: `bunx cap sync android && ./gradlew assembleRelease`

---

## 4. Pre-Merge Verification Checklist

Before merging any code change into `main`:
- [ ] All mandatory agent labels (`agent:*`) are attached.
- [ ] Type check (`bun run lint`) passes cleanly.
- [ ] Automated ERP test suites pass with 0 failures.
- [ ] Web, Windows EXE, and Android APK builds complete successfully.
