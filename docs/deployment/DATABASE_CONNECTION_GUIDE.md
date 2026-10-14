# Panduan Koneksi Database & Sinkronisasi LAN Server Produksi

Dokumen ini menjelaskan status koneksi database aplikasi **HRMS Pro** saat ini serta panduan alur sinkronisasi saat terhubung ke jaringan LAN server produksi.

---

## 1. Status Database Saat Ini

Aplikasi HRMS Pro saat ini dikonfigurasi untuk terhubung ke **Supabase Self-Hosted (PostgreSQL)** yang berjalan di **Server Produksi LAN (`192.168.1.254`)** melalui reverse proxy Nginx di URL `/supabase`.

### Detail Konfigurasi di [.env.local](file:///c:/HRMS-Pro/.env.local):

```properties
VITE_AUTH_SUPABASE_URL=/supabase
VITE_DATA_SUPABASE_URL=/supabase
VITE_SUPABASE_URL=/supabase
```

- **Keunggulan Konfigurasi Relatif (`/supabase`)**:
  - Saat web dibuka di browser via domain/IP server (misal: `http://192.168.1.254` atau domain publik), browser otomatis mengarahkan request database ke server tersebut tanpa perlu mengubah hardcoded IP.
  - Saat dev lokal dijalankan dengan Vite (`npm run dev`), Vite dev proxy menangani rute `/supabase` menuju database lokal/server.

---

## 2. Pilihan Mode Database (Di-switch via `.env.local`)

| Mode Koneksi | URL Endpoint | Keterangan & Penggunaan |
| :--- | :--- | :--- |
| **1. Server Produksi LAN (Default Active)** | `/supabase` | Digunakan saat terhubung ke jaringan LAN Rumah Sakit / Kantor dengan Server `192.168.1.254`. |
| **2. Standalone Laptop Dev (Offline)** | `http://localhost:54321` | Digunakan jika laptop tidak terhubung ke LAN dan ingin menggunakan Docker Supabase lokal di laptop. |
| **3. Cloud Supabase Hosted** | `https://gwfymzfrxsvtmtdhryft.supabase.co` | Digunakan untuk pengujian staging/cloud remote. |

---

## 3. Langkah Sinkronisasi saat Laptop Terhubung ke LAN Server (`192.168.1.254`)

Ketika laptop ini sudah kembali dicolokkan/terhubung ke jaringan Wi-Fi/LAN yang sama dengan server (`192.168.1.254`), Anda cukup menjalankan perintah sync berikut dari PowerShell di laptop ini:

```powershell
# Step 1: Buat Arsip Pembaharuan Kode (Excluding node_modules & temp files)
tar -czf C:\Users\cekce\AppData\Local\Temp\hrms-project.tar.gz --exclude="node_modules" --exclude=".git" --exclude=".expo" --exclude="mobile-absensi/node_modules" --exclude="backups" --exclude="logs" --exclude="public/downloads" .

# Step 2: Upload Arsip ke Home User Server via SCP
scp -i C:\Users\cekce\.ssh\id_rsa -o StrictHostKeyChecking=no C:\Users\cekce\AppData\Local\Temp\hrms-project.tar.gz hrms@192.168.1.254:/home/hrms/

# Step 3: Ekstrak & Redeploy di Server
ssh -i C:\Users\cekce\.ssh\id_rsa -o StrictHostKeyChecking=no hrms@192.168.1.254 "tar -xzf /home/hrms/hrms-project.tar.gz -C /home/hrms/HRMS-Pro/ && cd /home/hrms/HRMS-Pro && bash scripts/deploy.sh"
```

Semua perubahan kode (termasuk fitur **Drag & Drop Shift per Baris**) akan langsung aktif dan terhubung 100% ke database PostgreSQL produksi di server!
