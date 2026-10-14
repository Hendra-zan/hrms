-- ============================================================
-- Migration: Full-Text & Trigram Search Indexing (pg_trgm)
-- Tujuan   : Optimasi Performa Pencarian Karyawan Skala Massal (< 10ms)
-- ============================================================

-- 1. Mengaktifkan ekstensi pg_trgm untuk pencarian cepat teks/substring
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. GIN Index Trigram pada nama karyawan
CREATE INDEX IF NOT EXISTS idx_employees_nama_trgm
  ON public.employees USING gin (nama gin_trgm_ops);

-- 3. GIN Index Trigram pada NIK karyawan
CREATE INDEX IF NOT EXISTS idx_employees_nik_trgm
  ON public.employees USING gin (nik gin_trgm_ops)
  WHERE nik IS NOT NULL;

-- 4. GIN Index Trigram pada email karyawan
CREATE INDEX IF NOT EXISTS idx_employees_email_trgm
  ON public.employees USING gin (email gin_trgm_ops)
  WHERE email IS NOT NULL;

-- 5. B-Tree Index Gabungan untuk Filter Unit & Departemen
CREATE INDEX IF NOT EXISTS idx_employees_unit_dept
  ON public.employees ("unitKerjaId", departemen, status);

-- 6. Komentar Dokumentasi Indeks
COMMENT ON INDEX public.idx_employees_nama_trgm IS
  'Indeks GIN Trigram untuk optimasi pencarian nama karyawan skala massal.';
