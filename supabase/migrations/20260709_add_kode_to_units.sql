-- Tambah kolom kode ke tabel units
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS kode TEXT;

-- Tambah CHECK constraint agar kode unit berupa 2 digit angka
ALTER TABLE public.units DROP CONSTRAINT IF EXISTS check_units_kode_format;
ALTER TABLE public.units ADD CONSTRAINT check_units_kode_format CHECK (kode IS NULL OR kode ~ '^\d{2}$');

-- Tambah UNIQUE constraint agar kode unit unik
ALTER TABLE public.units DROP CONSTRAINT IF EXISTS units_kode_key;
ALTER TABLE public.units ADD CONSTRAINT units_kode_key UNIQUE (kode);

-- Tambah index untuk performa pencarian
CREATE INDEX IF NOT EXISTS idx_units_kode ON public.units (kode);

-- RLS Policy: Semua pengguna dapat membaca units (USING true)
DROP POLICY IF EXISTS "Semua pengguna dapat membaca units" ON public.units;
CREATE POLICY "Semua pengguna dapat membaca units" ON public.units
  FOR SELECT USING (true);
