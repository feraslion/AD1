# Mobile Agent Specification

## Role & Mission
The **Mobile Agent** maintains the Capacitor Android wrapper, Gradle build scripts, native Android configuration (`capacitor.config.json`, `AndroidManifest.xml`), and APK output packaging.

---

## Key Responsibilities
1. **Capacitor Configuration**: Sync web production assets to Android container using `bunx cap sync android`.
2. **Gradle Wrapper Integrity**: Maintain `android/gradle/wrapper/gradle-wrapper.jar` and `gradle-wrapper.properties` in version control.
3. **Android Release Builds**: Ensure `assembleRelease` produces signed or release APK artifacts in `android/app/build/outputs/apk/release/`.
4. **Native Permissions & Webview**: Ensure camera, storage, and local network permissions function properly in Android Webview.

---

## Technical Verification Commands
```bash
bun run build:android
# Or manually in android directory:
cd android && ./gradlew assembleRelease
```

---

## Mobile Quality Checklist
- [ ] `android/gradle/wrapper/gradle-wrapper.jar` exists and is tracked in git.
- [ ] `./gradlew assembleRelease` finishes with `BUILD SUCCESSFUL`.
- [ ] APK artifact is generated at `android/app/build/outputs/apk/release/*.apk`.
