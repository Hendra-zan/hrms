# 🤖 Panduan Pengembang AI (AI Developer Guide for HRMS-Pro)

Dokumen ini dirancang khusus untuk memandu AI coding agent (seperti Antigravity, Claude, GPT, atau Copilot) agar dapat mengerti konteks sistem, aturan kritis, dan alur kerja di repositori **HRMS-Pro**.

---

## ⚡ Quick Context: Apa itu HRMS-Pro?
* **Aplikasi:** Sistem Informasi Manajemen SDM Rumah Sakit (HRMS) dengan fitur absensi multi-metode (Face Recognition Hikvision, Fingerprint U.are.U, Mobile GPS/Selfie), penjadwalan shift rotasi dinamis, dan payroll otomatis.
* **Tech Stack Utama:**
  * Web Frontend: React 19, TypeScript, Vite, Tailwind CSS, Zustand, Recharts.
  * Mobile: React Native, Expo SDK 52, Expo Router / React Navigation.
  * Backend API: Node.js Express 4 (ESM), Helmet, Rate Limit, Sentry.
  * Database & Auth: PostgreSQL via Supabase (Auth, RLS, Storage).
  * Biometrik: Hikvision ISAPI (CGI XML/JSON), DigitalPersona WebSDK.

---

## 🚨 5 Aturan Kritis AI Saat Mengubah Kode (Crucial AI Rules)

1. **JANGAN Menulis File Monolitik Baru:**
   * Jika membuat fitur baru, selalu pisahkan ke dalam folder fitur dengan: `UI Component`, `Custom Hook`, `Service API`, dan `Types`.
2. **Jangan Merusak Skema Database & RLS:**
   * Sebelum mengubah tabel atau menambah kolom, selalu periksa file migrasi di `database/migrations/` dan tipe di `services/database.types.ts`.
3. **Pertahankan Isolasi Platform:**
   * Kode web (`components/`, `services/`) tidak boleh mengimpor modul React Native (`react-native`, `expo-*`), begitu pula sebaliknya pada folder `mobile-absensi/`.
4. **Pola Pemanggilan Layanan:**
   * UI components memanggil custom hooks atau function dari `services/*.ts`. Jangan pernah menulis query langsung `.from('table').select(...)` di dalam file JSX/TSX komponen.
5. **Verifikasi Build:**
   * Setelah melakukan perubahan file TypeScript, selalu pastikan kode bebas dari error tipe dengan menjalankan pengecekan syntax dan typing.

---

## 🧭 Navigasi Cepat Lokasi File

| Jika Anda Ingin Mengubah / Memperbaiki... | Periksa File / Direktori Ini |
| :--- | :--- |
| Logika Penjadwalan & Rotasi Shift | `components/unit-schedule/`, `services/scheduleService.ts` |
| Halaman Absensi, Filter, dan Verifikasi | `components/attendance/`, `hooks/useAttendanceHandlers.ts` |
| Integrasi Kamera Selfie / Face Recognition | `components/SelfieCamera.tsx`, `services/faceVerificationService.ts` |
| Integrasi Mesin Fingerprint / Hikvision | `components/hikvision/`, `services/hikvisionService.ts`, `server/routes/hikvisionRoutes.js` |
| Penggajian & Slip Gaji | `components/PayrollManagement.tsx`, `services/payrollService.ts` |
| Import / Export Excel Pegawai | `hooks/useEmployeeImport.ts`, `services/excelTemplateService.ts` |
| Routing & Navigasi Utama | `App.tsx`, `components/Sidebar/`, `components/guards/` |
