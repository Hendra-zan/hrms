-- ============================================================
-- Migration: Tambah kolom kompetensi dan sertifikasi ke employees
-- Tujuan   : Menyelaraskan skema database riil dengan skema Zod
--            dan data type frontend (types.ts/database.types.ts)
-- ============================================================

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS kompetensi TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS sertifikasi TEXT[] DEFAULT '{}'::text[];

COMMENT ON COLUMN public.employees.kompetensi IS 'Daftar kompetensi kunci karyawan (array text)';
COMMENT ON COLUMN public.employees.sertifikasi IS 'Daftar sertifikasi kompetensi karyawan (array text)';
