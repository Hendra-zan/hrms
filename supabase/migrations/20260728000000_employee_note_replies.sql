-- ============================================================================
-- Migration: Create employee_notes & employee_note_replies tables
-- Enables 2-Way Relational Notes, Incident Reports, and Multi-Thread Discussions
-- ============================================================================

-- 1. Create public.employee_notes table
CREATE TABLE IF NOT EXISTS public.employee_notes (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    category VARCHAR(50) DEFAULT 'general',
    priority VARCHAR(20) DEFAULT 'normal',
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    reply_content TEXT,
    status VARCHAR(20) DEFAULT 'unread',
    direction VARCHAR(20) DEFAULT 'top_down',
    due_date TIMESTAMPTZ,
    work_unit_id TEXT REFERENCES public.units(id) ON DELETE SET NULL,
    attachment_url TEXT,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create public.employee_note_replies table
CREATE TABLE IF NOT EXISTS public.employee_note_replies (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    note_id TEXT NOT NULL REFERENCES public.employee_notes(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_employee_notes_employee_id ON public.employee_notes(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_notes_sender_id ON public.employee_notes(sender_id);
CREATE INDEX IF NOT EXISTS idx_employee_notes_created_at ON public.employee_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_employee_note_replies_note_id ON public.employee_note_replies(note_id, created_at ASC);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.employee_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_note_replies ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for employee_notes
DROP POLICY IF EXISTS "Enable all access for employee_notes" ON public.employee_notes;
CREATE POLICY "Enable all access for employee_notes" 
    ON public.employee_notes FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 6. RLS Policies for employee_note_replies
DROP POLICY IF EXISTS "Enable all access for employee_note_replies" ON public.employee_note_replies;
CREATE POLICY "Enable all access for employee_note_replies" 
    ON public.employee_note_replies FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 7. Grant Permissions to roles for PostgREST API
GRANT ALL ON public.employee_notes TO anon, authenticated, service_role;
GRANT ALL ON public.employee_note_replies TO anon, authenticated, service_role;
