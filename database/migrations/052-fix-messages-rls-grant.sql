-- ============================================================
-- FIX: Grant akses tabel messages ke role authenticated
-- Tanpa GRANT ini, semua request dari user yang login (JWT)
-- akan ditolak 403 meski RLS policy sudah benar
-- ============================================================

-- 1. Grant privilege ke role authenticated (user login via JWT)
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO anon;

-- 2. Drop semua policy lama
DROP POLICY IF EXISTS "Karyawan dapat membaca pesan sendiri" ON public.messages;
DROP POLICY IF EXISTS "Karyawan dapat mengirim pesan" ON public.messages;
DROP POLICY IF EXISTS "Penerima dapat mengubah status baca" ON public.messages;
DROP POLICY IF EXISTS "messages_select_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_policy" ON public.messages;
DROP POLICY IF EXISTS "messages_update_policy" ON public.messages;

-- 3. Buat ulang RLS policies dengan role target eksplisit
CREATE POLICY "messages_select_policy" ON public.messages
    FOR SELECT
    TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "messages_update_policy" ON public.messages
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- 4. Pastikan RLS tetap aktif
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 5. Pastikan kolom baru (file_url, file_type) sudah ada
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS file_type TEXT;

-- 6. Pastikan last_seen sudah ada di employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT now();

-- 7. Grant employees table ke authenticated agar heartbeat bisa update
GRANT SELECT, UPDATE ON public.employees TO authenticated;

SELECT 'FIX APPLIED: messages RLS + GRANT authenticated OK' AS status;
