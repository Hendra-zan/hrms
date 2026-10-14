-- Database migration: add code columns to departments and positions

-- Add column 'kode' to departments
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS kode TEXT;
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS check_departments_kode;
ALTER TABLE public.departments ADD CONSTRAINT check_departments_kode CHECK (kode ~ '^\d{2}$');

-- Add column 'kode' to positions
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS kode TEXT;
ALTER TABLE public.positions DROP CONSTRAINT IF EXISTS check_positions_kode;
ALTER TABLE public.positions ADD CONSTRAINT check_positions_kode CHECK (kode ~ '^\d{2}$');

-- Enforce uniqueness of kode
ALTER TABLE public.departments DROP CONSTRAINT IF EXISTS departments_kode_key;
ALTER TABLE public.departments ADD CONSTRAINT departments_kode_key UNIQUE (kode);

ALTER TABLE public.positions DROP CONSTRAINT IF EXISTS positions_kode_key;
ALTER TABLE public.positions ADD CONSTRAINT positions_kode_key UNIQUE (kode);

-- Assign codes to existing departments
UPDATE public.departments SET kode = '01' WHERE nama = 'Departemen Medis';
UPDATE public.departments SET kode = '02' WHERE nama = 'Departemen Keperawatan';
UPDATE public.departments SET kode = '03' WHERE nama = 'Departemen Penunjang Medis';
UPDATE public.departments SET kode = '04' WHERE nama = 'Departemen Administrasi';
UPDATE public.departments SET kode = '05' WHERE nama = 'Departemen Keuangan';
UPDATE public.departments SET kode = '06' WHERE nama = 'Departemen SDM';

-- Handle any other custom departments (safety sequence)
DO $$
DECLARE
    dept_rec record;
    counter int := 7;
BEGIN
    FOR dept_rec IN SELECT id FROM public.departments WHERE kode IS NULL ORDER BY nama LOOP
        UPDATE public.departments SET kode = LPAD(counter::text, 2, '0') WHERE id = dept_rec.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Assign codes to existing positions
UPDATE public.positions SET kode = '01' WHERE nama = 'Dokter Umum';
UPDATE public.positions SET kode = '02' WHERE nama = 'Dokter Spesialis';
UPDATE public.positions SET kode = '03' WHERE nama = 'Perawat';
UPDATE public.positions SET kode = '04' WHERE nama = 'Bidan';
UPDATE public.positions SET kode = '05' WHERE nama = 'Apoteker';
UPDATE public.positions SET kode = '06' WHERE nama = 'Analis Laboratorium';
UPDATE public.positions SET kode = '07' WHERE nama = 'Radiografer';
UPDATE public.positions SET kode = '08' WHERE nama = 'Tenaga Administrasi';
UPDATE public.positions SET kode = '09' WHERE nama = 'Staf Keuangan';
UPDATE public.positions SET kode = '10' WHERE nama = 'Manajer';
UPDATE public.positions SET kode = '11' WHERE nama = 'Direktur';

-- Handle any other custom positions (safety sequence)
DO $$
DECLARE
    pos_rec record;
    counter int := 12;
BEGIN
    FOR pos_rec IN SELECT id FROM public.positions WHERE kode IS NULL ORDER BY nama LOOP
        UPDATE public.positions SET kode = LPAD(counter::text, 2, '0') WHERE id = pos_rec.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Make kode NOT NULL now that everything is populated
ALTER TABLE public.departments ALTER COLUMN kode SET NOT NULL;
ALTER TABLE public.positions ALTER COLUMN kode SET NOT NULL;

-- Update employee NIK description comment
COMMENT ON COLUMN public.employees.nik IS 'Nomor Induk Karyawan. Format: 11 digit (YYMMUUJJNNN where YY=tahun masuk, MM=bulan masuk, UU=kode unit, JJ=kode jabatan, NNN=nomor urut)';
