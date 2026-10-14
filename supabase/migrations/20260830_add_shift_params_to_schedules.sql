-- =============================================================================
-- Migration: Tambah kolom parameter shift ke employee_schedules
-- Fase:      1 dari 7 — Database Foundation
-- Tujuan:    Jadikan employee_schedules sebagai SSOT untuk semua parameter shift
--            (toleransi terlambat, durasi istirahat, threshold lembur, pulang cepat)
--            sehingga Mobile, Hikvision, dan Web semuanya membaca dari sumber yang sama.
-- Aman:      Semua kolom baru memiliki DEFAULT sehingga data lama tetap valid.
-- Penulis:   Antigravity — HRMS-Pro Attendance Accuracy Fix
-- =============================================================================

-- ── KOLOM BARU ─────────────────────────────────────────────────────────────────

ALTER TABLE public.employee_schedules
  ADD COLUMN IF NOT EXISTS late_tolerance_minutes      INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS break_duration_minutes      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_ot_threshold_minutes   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_leave_minutes         INTEGER;   -- NULL = belum checkout / tidak lebih awal

-- ── KOMENTAR KOLOM ─────────────────────────────────────────────────────────────

COMMENT ON COLUMN public.employee_schedules.late_tolerance_minutes IS
  'Toleransi keterlambatan (menit). Disalin dari units.shifts saat jadwal di-generate oleh scheduleService.
   DEFAULT 15 untuk backward-compatibility dengan data lama.
   SSOT untuk Mobile checkIn(), Hikvision sync, dan attendanceMetricsService.';

COMMENT ON COLUMN public.employee_schedules.break_duration_minutes IS
  'Durasi istirahat resmi (menit) yang dikurangi dari total jam kerja saat menghitung lembur.
   0 = tidak ada pengurangan istirahat.';

COMMENT ON COLUMN public.employee_schedules.auto_ot_threshold_minutes IS
  'Minimum menit kerja ekstra sebelum dianggap lembur resmi. 0 = langsung dihitung.
   Contoh: 30 = harus kerja >30 menit ekstra baru tercatat lembur.';

COMMENT ON COLUMN public.employee_schedules.early_leave_minutes IS
  'Berapa menit karyawan pulang lebih awal dari shift_end_time.
   NULL jika: belum checkout, atau pulang tepat waktu / lebih lama dari shift.
   Diisi otomatis saat checkOut() berhasil dan clockOut < shift_end_time.';

-- ── INDEX TAMBAHAN ─────────────────────────────────────────────────────────────
-- Index partial untuk query absensi yang hanya mau jadwal aktif (published/swapped/override).
-- Menggantikan pola .neq('status','cancelled') yang bocorkan jadwal 'draft'.

CREATE INDEX IF NOT EXISTS idx_employee_schedules_active_status
  ON public.employee_schedules (employee_id, schedule_date)
  WHERE status IN ('published', 'swapped', 'override');

COMMENT ON INDEX public.idx_employee_schedules_active_status IS
  'Index partial untuk lookup jadwal yang benar-benar aktif (published/swapped/override).
   Dipakai Mobile checkIn/checkOut, Hikvision sync, dan attendanceMetricsService.';

-- ── BACKFILL DATA LAMA (90 hari terakhir) ──────────────────────────────────────
-- Untuk jadwal yang sudah ada sebelum migration ini, isi late_tolerance_minutes
-- dengan nilai 15 (default global) karena kita tidak tahu nilai unit spesifik.
-- scheduleService.ts akan mengisi nilai yang benar untuk jadwal baru ke depannya.
-- Admin dapat menjalankan ulang generate jadwal bulanan untuk mengisi nilai unit spesifik.

UPDATE public.employee_schedules
SET    late_tolerance_minutes    = 15,
       break_duration_minutes    = 0,
       auto_ot_threshold_minutes = 0
WHERE  schedule_date >= (CURRENT_DATE - INTERVAL '90 days')
  AND  late_tolerance_minutes = 15   -- Hanya update yang masih default (bukan hasil generate baru)
  AND  break_duration_minutes = 0
  AND  auto_ot_threshold_minutes = 0;

-- ── VERIFIKASI ─────────────────────────────────────────────────────────────────
-- Jalankan query ini setelah migration untuk konfirmasi:
--
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM   information_schema.columns
-- WHERE  table_name  = 'employee_schedules'
--   AND  column_name IN (
--          'late_tolerance_minutes',
--          'break_duration_minutes',
--          'auto_ot_threshold_minutes',
--          'early_leave_minutes'
--        );
-- Expected: 4 baris, data_type = integer, 3 NOT NULL + 1 nullable.
