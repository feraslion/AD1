# Capacitor Android Integration & Deployment Guide

## Overview
AD1 ERP is designed as a cross-platform system supporting Web, Windows (Electron), and Android (Capacitor).

## Backend Connectivity Strategy on Mobile
Unlike Electron on Windows (which can launch `dist/server.cjs` as a Node.js child process), **Android cannot run Node.js Express as a background child process inside a mobile WebView**.

### Production Strategy for Android
For production deployment on Android:
1. **Hosted API Backend**: The backend Express server (`server.ts` / `dist/server.cjs`) must be deployed to a cloud server or remote host (e.g., Google Cloud Run, VPS, or dedicated server).
2. **API Endpoint Configuration**:
   - In `capacitor.config.json`, configure the remote server URL or configure environment variable `VITE_API_BASE_URL`:
   ```json
   {
     "appId": "com.feraslion.ad1",
     "appName": "AD1-ERP",
     "webDir": "dist",
     "server": {
       "androidScheme": "https"
     }
   }
   ```
   - In `src/core/api/client.ts`, the `resolveApiUrl()` function automatically directs all `/api/*` fetch requests to `VITE_API_BASE_URL` when running inside Capacitor or web environments.

3. **Offline / Local Fallback**: When the mobile device is offline, client-side caching and IndexedDB / LocalStorage state persist active carts and offline transactions, syncing back to the cloud API upon reconnection.

## Building Android APK
```bash
bun run build
npx cap sync android
npx cap open android
```
