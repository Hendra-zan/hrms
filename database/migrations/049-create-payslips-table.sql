-- ============================================================
-- Migration: Create public.payslips table
-- ============================================================
-- This table stores snapshot calculations of employee monthly payslips.
-- Storing payslips prevents historical recalculation changes when 
-- salary structures or historical logs are modified.

CREATE TABLE IF NOT EXISTS public.payslips (
    id TEXT PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    periode VARCHAR(50) NOT NULL, -- e.g., "Juli 2024"
    gaji_pokok NUMERIC(15,2) NOT NULL,
    tunjangan_profesi NUMERIC(15,2) NOT NULL,
    upah_lembur NUMERIC(15,2) NOT NULL,
    total_pendapatan NUMERIC(15,2) NOT NULL,
    potongan_pph21 NUMERIC(15,2) NOT NULL,
    potongan_bpjs NUMERIC(15,2) NOT NULL, -- legacy alias
    potongan_bpjs_kesehatan NUMERIC(15,2) NOT NULL,
    potongan_bpjs_ketenagakerjaan NUMERIC(15,2) NOT NULL,
    potongan_jht NUMERIC(15,2) NOT NULL,
    potongan_jp NUMERIC(15,2) NOT NULL,
    total_potongan NUMERIC(15,2) NOT NULL,
    gaji_bersih NUMERIC(15,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_employee_period UNIQUE (employee_id, periode)
);

-- Enable RLS
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;

-- Policies for RLS
DROP POLICY IF EXISTS "payslips_select_policy" ON public.payslips;
CREATE POLICY "payslips_select_policy" ON public.payslips
    FOR SELECT TO authenticated
    USING (
        -- Admin and HRD can view all payslips
        public.is_admin_or_hr_user() 
        OR 
        -- Employees can view their own payslips
        employee_id::text = public.current_employee_id()
    );

DROP POLICY IF EXISTS "payslips_insert_policy" ON public.payslips;
CREATE POLICY "payslips_insert_policy" ON public.payslips
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Only Admin or HRD can generate/insert payslips
        public.is_admin_or_hr_user()
    );

DROP POLICY IF EXISTS "payslips_delete_policy" ON public.payslips;
CREATE POLICY "payslips_delete_policy" ON public.payslips
    FOR DELETE TO authenticated
    USING (
        -- Only Admin can delete/regenerate payslips
        public.is_admin_user()
    );

-- Indexing for quick retrieval
CREATE INDEX IF NOT EXISTS idx_payslips_employee_id ON public.payslips(employee_id);
CREATE INDEX IF NOT EXISTS idx_payslips_periode ON public.payslips(periode);

COMMENT ON TABLE public.payslips IS 'Rekam permanen (snapshot) slip gaji bulanan karyawan untuk keperluan audit keuangan.';
