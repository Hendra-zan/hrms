-- Create messages table for real-time chat between employees
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_read BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Drop policies if exists
DROP POLICY IF EXISTS "Karyawan dapat membaca pesan sendiri" ON public.messages;
DROP POLICY IF EXISTS "Karyawan dapat mengirim pesan" ON public.messages;
DROP POLICY IF EXISTS "Penerima dapat mengubah status baca" ON public.messages;

-- RLS Policies
CREATE POLICY "Karyawan dapat membaca pesan sendiri" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Karyawan dapat mengirim pesan" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Penerima dapat mengubah status baca" ON public.messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- Enable real-time replication for this table in supabase
-- In Supabase local, we need to add the table to the supabase_realtime publication
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE messages;
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
