-- ============================================================
-- MIGRATION 060: ATOMIC SISA CUTI RPC & DB CONSTRAINT
-- ============================================================

-- 1. Tambahkan Check Constraint pada tabel employees (jika kolom sisaCuti berbentuk "sisaCuti")
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_sisa_cuti_non_negative'
    ) THEN
        ALTER TABLE public.employees
        ADD CONSTRAINT check_sisa_cuti_non_negative CHECK ("sisaCuti" >= 0);
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Constraint check_sisa_cuti_non_negative sudah ada atau diabaikan.';
END $$;

-- 2. Stored Procedure Atomic Deduct Sisa Cuti
CREATE OR REPLACE FUNCTION public.deduct_employee_sisa_cuti(
    p_employee_id UUID,
    p_duration_days INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_sisa INT;
    v_new_sisa INT;
BEGIN
    -- Lock row karyawan untuk menghindari concurrent TOCTOU update
    SELECT "sisaCuti" INTO v_current_sisa
    FROM public.employees
    WHERE id = p_employee_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Karyawan tidak ditemukan.');
    END IF;

    v_current_sisa := COALESCE(v_current_sisa, 0);
    v_new_sisa := v_current_sisa - p_duration_days;

    IF v_new_sisa < 0 THEN
        RETURN jsonb_build_object(
            'success', false, 
            'message', format('Sisa cuti tidak mencukupi (%s hari tersisa, butuh %s hari).', v_current_sisa, p_duration_days)
        );
    END IF;

    UPDATE public.employees
    SET "sisaCuti" = v_new_sisa
    WHERE id = p_employee_id;

    RETURN jsonb_build_object('success', true, 'new_sisa_cuti', v_new_sisa);
END;
$$;
