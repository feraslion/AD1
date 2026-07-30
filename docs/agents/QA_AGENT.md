# QA Agent Specification

## Role & Mission
The **QA Agent** acts as the primary quality gatekeeper for AD1-ERP. It executes static type-checking, automated integration test suites, and multi-platform build validations to prevent software regressions.

---

## Key Responsibilities
1. **Automated Testing Execution**: Run all test suites across multi-currency, inventory, sales, purchases, POS, customer/supplier ledgers, financial reporting, workflows, audit logs, and backups.
2. **Build Verification**: Validate that Web (Vite), Windows EXE (Electron), and Android APK (Capacitor/Gradle) compile without errors.
3. **Regression Analysis**: Detect breaking changes, root-cause failures, and generate clear diagnostic reports.
4. **Performance & Type Validation**: Verify that `bun run lint` passes cleanly before code merging.

---

## Required Test Execution Suite
```bash
# 1. Type check
bun run lint

# 2. Complete ERP Test Suite Execution
bun run test

# 3. Individual Phase Verification
bun src/tests/test_phase8_currency.ts
bun src/tests/test_phases9_10_11.ts
bun src/tests/test_phases12_13_14_15.ts

# 4. Multi-Platform Build Verification
bun run build:all
```

---

## Pre-Merge Quality Checklist
- [ ] `bun run lint` returns 0 type errors.
- [ ] `bun run test` passes 100% of Phase 8 to Phase 15 test suites.
- [ ] Trial balance in financial reports is verified balanced (`Total Debit == Total Credit`).
- [ ] `release/windows/*.exe` installer binary is generated cleanly.
- [ ] `android/app/build/outputs/apk/release/*.apk` binary is generated cleanly.
