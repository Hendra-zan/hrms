-- ============================================================
-- Migration: Tambah kolom pin_mesin ke tabel employees
-- Tujuan   : Mapping antara ID pendek mesin absensi fisik
--            (Hikvision, ZKTeco, dll) dan data karyawan HRMS
-- Format   : TEXT nullable, unique, maks 20 karakter
-- ============================================================

-- 1. Tambah kolom pin_mesin
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS pin_mesin TEXT DEFAULT NULL;

-- 2. UNIQUE constraint — satu PIN hanya untuk satu karyawan
ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS uq_employees_pin_mesin;

ALTER TABLE public.employees
  ADD CONSTRAINT uq_employees_pin_mesin UNIQUE (pin_mesin);

-- 3. CHECK constraint — hanya boleh angka atau null (maks 20 digit)
ALTER TABLE public.employees
  DROP CONSTRAINT IF EXISTS ck_employees_pin_mesin;

ALTER TABLE public.employees
  ADD CONSTRAINT ck_employees_pin_mesin
    CHECK (pin_mesin IS NULL OR pin_mesin ~ '^\d{1,20}$');

-- 4. Index untuk lookup cepat saat sinkronisasi absensi
CREATE INDEX IF NOT EXISTS idx_employees_pin_mesin
  ON public.employees (pin_mesin)
  WHERE pin_mesin IS NOT NULL;

-- 5. Komentar dokumentasi kolom
COMMENT ON COLUMN public.employees.pin_mesin IS
  'ID/PIN karyawan di mesin absensi fisik (Hikvision, ZKTeco, dll). '
  'Berupa angka 1-20 digit. Nullable jika karyawan belum terdaftar di mesin.';
