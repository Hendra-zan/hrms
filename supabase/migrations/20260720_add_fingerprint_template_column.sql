-- ============================================================
-- Migration: Add Fingerprint Template Column for U.are.U 4500
-- Tujuan   : Penyimpanan Template Biometrik Sidik Jari USB Scanner
-- ============================================================

-- 1. Tambah kolom fingerprint_template & timestamp pendaftaran pada tabel employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS fingerprint_template JSONB,
  ADD COLUMN IF NOT EXISTS fingerprint_enrolled_at TIMESTAMPTZ;

-- 2. Indeks partial untuk karyawan yang sudah terdaftar sidik jari
CREATE INDEX IF NOT EXISTS idx_employees_fingerprint_enrolled
  ON public.employees(id)
  WHERE fingerprint_template IS NOT NULL;

-- 3. Komentar Kolom Dokumentasi
COMMENT ON COLUMN public.employees.fingerprint_template IS 'Data template biometrik sidik jari (U.are.U 4500 DigitalPersona Minutiae).';
COMMENT ON COLUMN public.employees.fingerprint_enrolled_at IS 'Waktu timestamp pendaftaran sidik jari USB scanner.';
