# Desktop Agent Specification

## Role & Mission
The **Desktop Agent** maintains the Electron desktop application, `electron/main.js` process entry, window management, system tray integration, and `electron-builder` packaging for Windows installer execution (`.exe`).

---

## Key Responsibilities
1. **Electron Main Process**: Maintain `electron/main.js` with secure context isolation and local web server / asset loading.
2. **Electron-Builder Configuration**: Maintain `electron-builder.yml` and `package.json` build targets (`--win --x64`).
3. **Publishing Controls**: Set `publish: null` or `-c.publish=never` to prevent missing `GH_TOKEN` errors during offline/CI packaging.
4. **Installer Output Verification**: Ensure Windows executable installers compile into `release/windows/`.

---

## Technical Verification Commands
```bash
bun run build:windows
# Or directly via electron-builder:
bunx electron-builder --win -c.publish=never
```

---

## Desktop Quality Checklist
- [ ] `electron/main.js` loads index file or production server reliably.
- [ ] `electron-builder.yml` contains correct appId, productName, and directories settings.
- [ ] Windows EXE packaging completes without `GH_TOKEN` or publish errors.
- [ ] Executable file exists under `release/windows/*.exe`.
