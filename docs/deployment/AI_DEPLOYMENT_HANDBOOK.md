# AI Deployment Handbook - HRMS Pro

Welcome, Agent! This handbook contains all the necessary operational data, commands, directories, and architectural gotchas required to deploy updates to the HRMS Pro application. Read this file completely before initiating any compilation or server sync.

---

## 1. Network & Infrastructure Configuration

- **Production Server IP**: `192.168.1.254` (Private subnet inside the hospital intranet).
- **SSH Port**: `22` (default).
- **SSH Username**: `hrms`
- **SSH Private Key Path (Local)**: `C:\Users\cekce\.ssh\id_rsa`
- **Project Directory on Server**: `/home/hrms/HRMS-Pro`
- **SSL Domain Name**: `absensi.rsumeloy.com`
- **Local Supabase Ports (on Server Host)**:
  - Kong API Gateway: `54321` (accessible via `http://192.168.1.254:54321`)
  - Studio Web Interface: `54323` (accessible via `http://192.168.1.254:54323`)
  - PostgreSQL Database: `54322` (accessible via localhost port `54322`, container name: `supabase_db_HRMS_Pro`)

---

## 2. Step-by-Step Deployment Pipeline

Always follow this exact sequence to build, package, and deploy modifications.

### Step 2.1: Run Local Tests
Verify that your changes have not broken the codebase. All integration and unit tests must pass:
```powershell
npm test
```

### Step 2.2: Compile the Android Release APK
If there are any changes to the mobile application (`mobile-absensi` folder), compile a new release APK locally:
```powershell
cd mobile-absensi
npm run build:android:release
```
Copy the compiled APK output into the static assets downloads folder:
```powershell
Copy-Item -Path "c:\HRMS-Pro\mobile-absensi\android\app\build\outputs\apk\release\app-release.apk" -Destination "c:\HRMS-Pro\public\downloads\app-release.apk" -Force
```

### Step 2.3: Package the Web Codebase (excluding large directories)
Archive the local workspace to a temporary `.tar.gz` archive. Note that we exclude `public/downloads` to keep the archive size small and avoid compressing the binary APK:
```powershell
tar -czf C:\Users\cekce\AppData\Local\Temp\hrms-project.tar.gz --exclude="node_modules" --exclude=".git" --exclude=".expo" --exclude="mobile-absensi/node_modules" --exclude="backups" --exclude="logs" --exclude="public/downloads" .
```

### Step 2.4: Transfer the Archive and APK to the Server
1. Copy the `.tar.gz` archive via SCP:
   ```powershell
   scp -i C:\Users\cekce\.ssh\id_rsa -o StrictHostKeyChecking=no C:\Users\cekce\AppData\Local\Temp\hrms-project.tar.gz hrms@192.168.1.254:/home/hrms/
   ```
2. Copy the fresh `.apk` file directly to the server's public downloads directory:
   ```powershell
   scp -i C:\Users\cekce\.ssh\id_rsa -o StrictHostKeyChecking=no c:\HRMS-Pro\public\downloads\app-release.apk hrms@192.168.1.254:/home/hrms/HRMS-Pro/public/downloads/app-release.apk
   ```

### Step 2.5: Extract the Codebase on the Server
Extract the uploaded tarball into the server project directory:
```powershell
ssh -i C:\Users\cekce\.ssh\id_rsa -o StrictHostKeyChecking=no hrms@192.168.1.254 "tar -xzf /home/hrms/hrms-project.tar.gz -C /home/hrms/HRMS-Pro/"
```

### Step 2.6: Sync APK to the Nginx Serving Directory
Copy the uploaded APK file into the active Nginx distribution `dist` folder:
```powershell
ssh -i C:\Users\cekce\.ssh\id_rsa -o StrictHostKeyChecking=no hrms@192.168.1.254 "cp /home/hrms/HRMS-Pro/public/downloads/app-release.apk /home/hrms/HRMS-Pro/dist/downloads/app-release.apk"
```

### Step 2.7: Trigger Redeployment and Health Checks
Execute the production redeployment script on the server. This script manages service backups, PM2 restarts, Docker Compose builds, and health checks:
```powershell
ssh -i C:\Users\cekce\.ssh\id_rsa -o StrictHostKeyChecking=no hrms@192.168.1.254 "cd /home/hrms/HRMS-Pro && bash scripts/deploy.sh"
```

---

## 3. Important Architectural Gotchas

### Gotcha A: PWA & Vite Dynamic Imports (ChunkLoadError)
- **Problem**: When a new version is deployed, Vite compiles new JS chunks with new file hashes. If a user has the app open, navigating to dynamically imported routes triggers a 404 error because the old file hashes are gone from the server.
- **Implementation**: We use the `lazyWithRetry` wrapper inside [lazyWithRetry.ts](file:///c:/HRMS-Pro/utils/lazyWithRetry.ts). It catches dynamic import failures and triggers a browser `window.location.reload()` to load the fresh bundle automatically. Always wrap dynamically-loaded components with `lazyWithRetry` instead of raw `React.lazy`.

### Gotcha B: Volume Mappings inside `deploy/docker-compose.prod.yml`
- **Location**: All relative paths inside `deploy/docker-compose.prod.yml` must target the parent directory (`../`) since the compose file sits inside `deploy/`.
- **Nginx Volume**: Nginx serves files directly from the parent `dist` directory:
  ```yaml
  - ../dist:/usr/share/nginx/html:ro
  ```
  Therefore, any static files served directly to users (such as `/downloads/app-release.apk`) must exist in the `/home/hrms/HRMS-Pro/dist/downloads/` folder on the host server.

### Gotcha C: Supabase Client & PORT Configurations
- The web app uses standard ports managed by Kong: `http://192.168.1.254:54321`.
- The database is inside a Docker container named `supabase_db_HRMS_Pro` on port `54322`. To execute migrations or query tables directly from the host CLI, use:
  ```bash
  docker exec -i supabase_db_HRMS_Pro psql -U postgres -d postgres
  ```
