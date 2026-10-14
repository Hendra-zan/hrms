# 📐 Standar Koding & Konvensi Pengembangan HRMS-Pro

Dokumen ini wajib dipatuhi oleh seluruh pengembang (manusia dan AI Assistant) untuk menjaga keterbacaan, modularitas, dan kestabilan sistem.

---

## 1. Aturan Batas Ukuran File (Rule of 350 Lines)

1. **Komponen React:** Maksimal **350 baris** per file.
   * Jika komponen mendekati 400 baris, lakukan pemisahan:
     * **UI Sub-components:** Pindahkan modal, dialog, baris tabel, atau kartu ke file terpisah di subfolder fitur.
     * **Custom Hook:** Pindahkan seluruh `useState`, `useEffect`, `useMemo`, dan fungsi handler mutasi ke custom hook terpisah (`hooks/use[Feature].ts`).
     * **Helper & Pure Functions:** Pindahkan kalkulasi, pemformatan tanggal, atau parser ke file `utils/` murni.
2. **Services / Backend Handlers:** Maksimal **400 baris** per file. Pisahkan modul CRUD dari business calculation engine.

---

## 2. Struktur Modul & Penamaan File

* Gunakan pola **Feature Slice** atau pengelompokan berbasis domain.
* **Format Penamaan:**
  * Komponen React / UI: `PascalCase.tsx` (contoh: `CalendarGridTable.tsx`, `ShiftAssignmentModal.tsx`)
  * Custom Hooks: `camelCase.ts` dengan prefix `use` (contoh: `useScheduleCalendarState.ts`)
  * Services & Utilities: `camelCase.ts` (contoh: `scheduleService.ts`, `scheduleExportHelpers.ts`)
  * Type Definitions: `[domain].types.ts` atau `types.ts`

---

## 3. Konvensi State Management & Hooks

* **Local Component State:** Gunakan `useState` / `useReducer` untuk state yang hanya mempengaruhi 1 komponen (seperti input form, active tab lokal, visibilitas modal).
* **Domain Feature State:** Gunakan custom hook per fitur untuk membungkus query data dan mutasi.
* **Global State (Zustand):** Hanya untuk state lintas halaman/fitur:
  * User Auth & Profile
  * App UI Settings (Dark/Light mode, Sidebar state, Active portal)
  * Realtime Global Notifications

---

## 4. Standar Akses Data & Database Boundary

```
[UI Component] ──> [Custom Hook] ──> [Service Layer] ──┬──> [Supabase Client (RLS Protected)]
                                                      └──> [Express API Gateway (/api/*)]
```

* **DILARANG** melakukan query SQL atau pemanggilan SDK Supabase langsung di dalam JSX komponen presentasional. Seluruh akses wajib melalui `services/*.ts`.
* Operasi massal (*bulk mutation*), sinkronisasi hardware (Hikvision), dan export/import berat harus melalui Express API atau background queue.

---

## 5. Standar TypeScript & Validasi Schema

* Hindari penggunaan tipe `any`. Gunakan interface/type dari `types.ts` atau `services/database.types.ts`.
* Selalu tentukan return type secara eksplisit pada fungsi service:
  ```typescript
  export async function getSchedulesByUnit(unitId: string, month: string): Promise<EmployeeSchedule[]> {
      // ...
  }
  ```
* Gunakan `zod` untuk validasi payload input pada Express Server dan form kompleks.
