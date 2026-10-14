-- Migration: Create employee_work_logs table for Daily Work Logbook feature
CREATE TABLE IF NOT EXISTS public.employee_work_logs (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    employee_nama TEXT,
    unit_kerja_id TEXT,
    log_date DATE NOT NULL DEFAULT CURRENT_DATE,
    shift TEXT NOT NULL DEFAULT 'pagi',
    start_time TEXT NOT NULL DEFAULT '08:00',
    end_time TEXT NOT NULL DEFAULT '16:00',
    duration_minutes INTEGER NOT NULL DEFAULT 0,
    title TEXT NOT NULL,
    activity_description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'pelayanan_pasien',
    patient_count INTEGER,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    verified_by TEXT,
    verified_at TIMESTAMPTZ,
    verifier_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast query
CREATE INDEX IF NOT EXISTS idx_employee_work_logs_employee_id ON public.employee_work_logs(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_work_logs_unit_kerja_id ON public.employee_work_logs(unit_kerja_id);
CREATE INDEX IF NOT EXISTS idx_employee_work_logs_log_date ON public.employee_work_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_employee_work_logs_status ON public.employee_work_logs(status);

-- Enable RLS
ALTER TABLE public.employee_work_logs ENABLE ROW LEVEL SECURITY;

-- Allow all access policy for app
DROP POLICY IF EXISTS "Allow all access to employee_work_logs" ON public.employee_work_logs;
CREATE POLICY "Allow all access to employee_work_logs" ON public.employee_work_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);
