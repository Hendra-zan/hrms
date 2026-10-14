-- Migration: 20260909_announcement_upgrades.sql
-- Description: Upgrade announcements table with audience targeting, attachments, pinning, expiry, and read receipts.

-- 1. Alter public.announcements table to add new columns
ALTER TABLE public.announcements 
    ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) DEFAULT 'all' NOT NULL, -- 'all' | 'units' | 'departments' | 'roles'
    ADD COLUMN IF NOT EXISTS target_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
    ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb NOT NULL, -- [{ id, name, url, size, mimeType }]
    ADD COLUMN IF NOT EXISTS requires_acknowledgment BOOLEAN DEFAULT false NOT NULL,
    ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'published' NOT NULL, -- 'draft' | 'published' | 'archived'
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE NULL;

-- 2. Create index on announcements for performance
CREATE INDEX IF NOT EXISTS idx_announcements_pinned_created 
    ON public.announcements(is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_status 
    ON public.announcements(status);

-- 3. Create table for tracking read receipts and legal acknowledgments
CREATE TABLE IF NOT EXISTS public.announcement_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    acknowledged_at TIMESTAMP WITH TIME ZONE NULL,
    CONSTRAINT uq_announcement_employee UNIQUE (announcement_id, employee_id)
);

-- 4. Enable RLS on announcement_reads
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for announcement_reads
CREATE POLICY announcement_reads_select_policy ON public.announcement_reads
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY announcement_reads_insert_policy ON public.announcement_reads
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY announcement_reads_update_policy ON public.announcement_reads
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Grant privileges
GRANT ALL ON public.announcement_reads TO postgres;
GRANT ALL ON public.announcement_reads TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.announcement_reads TO authenticated;
GRANT SELECT ON public.announcement_reads TO anon;
