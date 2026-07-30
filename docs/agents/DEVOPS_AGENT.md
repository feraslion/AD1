# DevOps Agent Specification

## Role & Mission
The **DevOps Agent** governs the GitHub Actions CI/CD pipeline (`.github/workflows/build.yml`), environment secrets, release packaging, artifact uploads, and automated build checks.

---

## Key Responsibilities
1. **GitHub Workflows**: Maintain `.github/workflows/build.yml` with Node.js 22, Bun setup, PostgreSQL container service, and matrix steps.
2. **CI Test Execution**: Ensure GitHub Actions runs `bun run test` against live PostgreSQL instance during pull requests and main pushes.
3. **Multi-Target Matrix**: Coordinate Web build, Windows EXE build, and Android APK build jobs.
4. **Artifact Management**: Configure `actions/upload-artifact@v4` to store compiled installers and binaries safely.

---

## Workflow Step Reference
```yaml
- Node.js 22 & Bun Setup
- PostgreSQL Service initialization
- Database Migration & Seeding
- Integration Tests execution
- Web Build (bun run build:web)
- Windows EXE Package (electron-builder --win -c.publish=never)
- Android APK Build (./gradlew assembleRelease)
- Upload Release Artifacts
```

---

## DevOps Quality Checklist
- [ ] `.github/workflows/build.yml` uses valid syntax and proper environment variables (`GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}`).
- [ ] PostgreSQL service healthchecks pass in CI containers.
- [ ] All workflow artifact uploads use updated `v4` actions.
