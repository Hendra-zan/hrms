# Panduan Sinkronisasi & Deployment Server Produksi (LAN)

**Fitur**: Row-Level Drag & Drop Shift Scheduling  
**Sync Tag**: `HRMS-PRO-DND-SHIFT-SYNC-20260803`  
**Status**: Fitur telah terimplementasi di kode lokal. Siap di-deploy saat laptop terhubung kembali ke jaringan LAN Server (`192.168.1.254`).

---

## Informasi Server Produksi

- **IP Server**: `192.168.1.254` (SSH Port 22)
- **Username SSH**: `hrms`
- **SSH Key**: `C:\Users\cekce\.ssh\id_rsa`
- **Folder Project Server**: `/home/hrms/HRMS-Pro`

---

## Perintah Deployment Otomatis (Eksekusi dari PowerShell saat terhubung LAN)

Saat laptop sudah terhubung ke jaringan LAN yang sama dengan server (`192.168.1.254`), jalankan langkah berikut di terminal PowerShell:

### 1. Buat Arsip & Kirim ke Server:
```powershell
tar -czf C:\Users\cekce\AppData\Local\Temp\hrms-project.tar.gz --exclude="node_modules" --exclude=".git" --exclude=".expo" --exclude="mobile-absensi/node_modules" --exclude="backups" --exclude="logs" --exclude="public/downloads" .

scp -i C:\Users\cekce\.ssh\id_rsa -o StrictHostKeyChecking=no C:\Users\cekce\AppData\Local\Temp\hrms-project.tar.gz hrms@192.168.1.254:/home/hrms/
```

### 2. Ekstrak & Restart Service di Server:
```powershell
ssh -i C:\Users\cekce\.ssh\id_rsa -o StrictHostKeyChecking=no hrms@192.168.1.254 "tar -xzf /home/hrms/hrms-project.tar.gz -C /home/hrms/HRMS-Pro/ && cd /home/hrms/HRMS-Pro && bash scripts/deploy.sh"
```

---

## File yang Diperbarui pada Fitur Ini

1. **[ScheduleCalendarPanel.tsx](file:///c:/HRMS-Pro/components/ScheduleCalendarPanel.tsx)**
   - Penambahan State Drag & Drop per baris (`draggedCell`, `dragOverTarget`, `hasUnsavedDndChanges`).
   - Implementasi Event Handler Row-Isolation (`handleDragStart`, `handleDragOver`, `handleDrop`, `handleDragEnd`).
   - Tombol **💾 Simpan Draf Geser** untuk batch update ke database Supabase.
   - Penanda Sync Tag: `HRMS-PRO-DND-SHIFT-SYNC-20260803`.
