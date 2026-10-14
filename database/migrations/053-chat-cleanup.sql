-- ============================================================
-- 053: Chat History Cleanup
-- 1. Grant DELETE ke authenticated
-- 2. RLS policy untuk DELETE
-- 3. RPC function hapus percakapan antar 2 user
-- 4. RPC function hapus semua pesan lama (> N hari)
-- ============================================================

-- Grant DELETE ke authenticated role
GRANT DELETE ON public.messages TO authenticated;

-- RLS policy: user hanya bisa hapus pesan yang dia kirim atau dia terima
DROP POLICY IF EXISTS "messages_delete_policy" ON public.messages;
CREATE POLICY "messages_delete_policy" ON public.messages
    FOR DELETE
    TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- -----------------------------------------------
-- RPC: Hapus percakapan antara 2 user (dipanggil dari UI)
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_conversation(other_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.messages
    WHERE (sender_id = auth.uid() AND receiver_id = other_user_id)
       OR (sender_id = other_user_id AND receiver_id = auth.uid());
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Grant RPC ke authenticated
GRANT EXECUTE ON FUNCTION public.delete_conversation(UUID) TO authenticated;

-- -----------------------------------------------
-- RPC: Hapus semua pesan lama (admin / cron)
-- Parameter: days_to_keep = jumlah hari yang dipertahankan (default 30)
-- -----------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_messages(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.messages
    WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Grant RPC ke authenticated (untuk admin) dan service_role
GRANT EXECUTE ON FUNCTION public.cleanup_old_messages(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_messages(INTEGER) TO service_role;

-- -----------------------------------------------
-- Aktifkan pg_cron jika tersedia (auto-cleanup tiap tengah malam)
-- Hapus pesan lebih dari 30 hari setiap hari pukul 00:00
-- -----------------------------------------------
DO $$
BEGIN
    -- Cek apakah pg_cron extension tersedia
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Hapus jadwal lama jika ada
        PERFORM cron.unschedule('cleanup_old_messages_daily');
        -- Buat jadwal baru: setiap hari pukul 00:00
        PERFORM cron.schedule(
            'cleanup_old_messages_daily',
            '0 0 * * *',
            $$SELECT public.cleanup_old_messages(30)$$
        );
        RAISE NOTICE 'pg_cron scheduled: cleanup_old_messages_daily at 00:00 daily';
    ELSE
        RAISE NOTICE 'pg_cron not available. Run cleanup_old_messages() manually or via external cron.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron setup skipped: %', SQLERRM;
END $$;

SELECT 'Chat cleanup functions created OK' AS status;
