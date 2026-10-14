# Custom Workspace Rules for Antigravity Coding Assistant

## Server Deployment Configuration

Whenever deploying updates for the HRMS Pro application to the production server:
- **Server IP Address**: `192.168.1.254` (reachable on default SSH port 22)
- **SSH Username**: `hrms`
- **SSH Key**: The default private key at `C:\Users\REMOTE\.ssh\id_server_ed25519` is authorized on the server for user `hrms`.
- **Project Directory on Server**: `/home/hrms/HRMS-Pro`
- **Preferred Deployment Method**:
  1. Archive the local project files (excluding `node_modules`, `.git`, `.expo`, `mobile-absensi/node_modules`, `backups`, and `logs`) to a temporary tar file:
     ```powershell
     tar -czf C:\Users\REMOTE\AppData\Local\Temp\hrms-project.tar.gz --exclude="node_modules" --exclude=".git" --exclude=".expo" --exclude="mobile-absensi/node_modules" --exclude="backups" --exclude="logs" --exclude="public/downloads" .
     ```
  2. Copy the `.tar.gz` archive to the server home folder via SCP:
     ```powershell
     scp -i C:\Users\REMOTE\.ssh\id_server_ed25519 -o StrictHostKeyChecking=no C:\Users\REMOTE\AppData\Local\Temp\hrms-project.tar.gz hrms@192.168.1.254:/home/hrms/
     ```
  3. Extract the archive on the server into the project directory:
     ```powershell
     ssh -i C:\Users\REMOTE\.ssh\id_server_ed25519 -o StrictHostKeyChecking=no hrms@192.168.1.254 "tar -xzf /home/hrms/hrms-project.tar.gz -C /home/hrms/HRMS-Pro/"
     ```
  4. Clean up the temporary files both locally and on the server.
  5. **Directly Upload APK via SCP** (Required since `public/downloads` is excluded from the main archive):
     ```powershell
     scp -i C:\Users\REMOTE\.ssh\id_server_ed25519 -o StrictHostKeyChecking=no d:\HRMS-Pro\public\downloads\app-release.apk hrms@192.168.1.254:/home/hrms/HRMS-Pro/public/downloads/app-release.apk
     ```
  6. **Copy APK to Active distribution folder** (so Nginx serves the updated APK immediately):
     ```powershell
     ssh -i C:\Users\REMOTE\.ssh\id_server_ed25519 -o StrictHostKeyChecking=no hrms@192.168.1.254 "cp /home/hrms/HRMS-Pro/public/downloads/app-release.apk /home/hrms/HRMS-Pro/dist/downloads/app-release.apk"
     ```
  7. Execute the redeployment script on the server:
     ```powershell
     ssh -i C:\Users\REMOTE\.ssh\id_server_ed25519 -o StrictHostKeyChecking=no hrms@192.168.1.254 "cd /home/hrms/HRMS-Pro && bash scripts/deploy.sh"
     ```

*For more in-depth documentation on database ports, proxy routes, dynamic chunk lazy load recovery, and ELK infrastructure, refer to the [AI_DEPLOYMENT_HANDBOOK.md](file:///c:/HRMS-Pro/docs/deployment/AI_DEPLOYMENT_HANDBOOK.md).*

