-- ============================================================
-- RPC: Bulk Employee Import with Transaction Support
-- ============================================================
-- This function handles batch insert with proper transaction
-- and returns detailed results for each row

CREATE OR REPLACE FUNCTION public.create_employees_batch(
    employees_data jsonb,
    import_session_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    employee_record jsonb;
    inserted_employee public.employees;
    result jsonb;
    success_count int := 0;
    skip_count int := 0;
    error_count int := 0;
    errors jsonb[] := ARRAY[]::jsonb[];
    existing_emails text[];
    existing_niks text[];
    row_number int := 0;
    session_uuid uuid;
BEGIN
    -- Check permission
    IF NOT public.is_admin_or_hr_user() THEN
        RAISE EXCEPTION 'Forbidden: Only admin or HR can import employees' USING ERRCODE = '42501';
    END IF;

    -- Create or use import session
    session_uuid := COALESCE(import_session_id, gen_random_uuid());

    -- Pre-fetch existing data untuk duplicate check
    SELECT array_agg(lower(email)) INTO existing_emails
    FROM public.employees WHERE email IS NOT NULL;
    
    SELECT array_agg(nik) INTO existing_niks  
    FROM public.employees WHERE nik IS NOT NULL AND nik <> '';

    -- Create initial log entry to satisfy foreign key constraint!
    IF import_session_id IS NULL THEN
        INSERT INTO public.import_logs (id, imported_by, total_rows, success_count, skip_count, error_count, errors, created_at)
        VALUES (session_uuid, auth.uid(), 0, 0, 0, 0, '[]'::jsonb, NOW());
    END IF;

    -- Process each employee
    FOR employee_record IN SELECT value FROM jsonb_array_elements(employees_data)
    LOOP
        row_number := row_number + 1;
        
        DECLARE
            emp_email text := lower(NULLIF(employee_record->>'email', ''));
            emp_nik text := NULLIF(employee_record->>'nik', '');
            emp_nama text := NULLIF(employee_record->>'nama', '');
            error_msg text;
        BEGIN
            -- Validation: Required fields
            IF emp_nama IS NULL OR emp_nama = '' THEN
                error_count := error_count + 1;
                errors := array_append(errors, jsonb_build_object(
                    'row', row_number,
                    'category', 'ERROR',
                    'field', 'nama',
                    'message', 'Nama wajib diisi',
                    'data', employee_record
                ));
                CONTINUE;
            END IF;

            -- Check duplicate email (case insensitive)
            IF emp_email IS NOT NULL AND emp_email = ANY(existing_emails) THEN
                skip_count := skip_count + 1;
                errors := array_append(errors, jsonb_build_object(
                    'row', row_number,
                    'category', 'SKIP',
                    'field', 'email',
                    'message', format('Email %s sudah terdaftar', emp_email),
                    'data', employee_record
                ));
                CONTINUE;
            END IF;

            -- Check duplicate NIK
            IF emp_nik IS NOT NULL AND emp_nik = ANY(existing_niks) THEN
                skip_count := skip_count + 1;
                errors := array_append(errors, jsonb_build_object(
                    'row', row_number,
                    'category', 'SKIP',
                    'field', 'nik',
                    'message', format('NIK %s sudah terdaftar', emp_nik),
                    'data', employee_record
                ));
                CONTINUE;
            END IF;

            -- Insert employee
            INSERT INTO public.employees (
                user_id, nik, nama, foto, jabatan, departemen, email, telepon,
                "hireDate", "birthDate", status, shift, "sisaCuti", role,
                spesialisasi, kredensial, "nomorSTR", "tanggalKadaluarsaSTR",
                "unitKerjaId", ktp_number, npwp, bpjs_kesehatan, bpjs_ketenagakerjaan,
                agama, marital_status, dependents, address, emergency_contacts,
                education, work_history, bank_account, is_profile_completed,
                is_verified, verified_by, verified_at, is_locked, managed_unit_id,
                "gajiPokok", "tunjanganProfesi",
                imported_at, import_session_id
            ) VALUES (
                NULLIF(employee_record->>'user_id', '')::uuid,
                emp_nik,
                emp_nama,
                NULLIF(employee_record->>'foto', ''),
                NULLIF(employee_record->>'jabatan', ''),
                NULLIF(employee_record->>'departemen', ''),
                emp_email,
                NULLIF(employee_record->>'telepon', ''),
                NULLIF(employee_record->>'hireDate', '')::date,
                NULLIF(employee_record->>'birthDate', '')::date,
                COALESCE(NULLIF(employee_record->>'status', ''), 'Aktif'),
                NULLIF(employee_record->>'shift', ''),
                COALESCE(NULLIF(employee_record->>'sisaCuti', '')::integer, 12),
                COALESCE(NULLIF(employee_record->>'role', ''), 'karyawan'),
                NULLIF(employee_record->>'spesialisasi', ''),
                NULLIF(employee_record->>'kredensial', ''),
                NULLIF(employee_record->>'nomorSTR', ''),
                NULLIF(employee_record->>'tanggalKadaluarsaSTR', '')::date,
                NULLIF(employee_record->>'unitKerjaId', ''),
                NULLIF(employee_record->>'ktp_number', ''),
                NULLIF(employee_record->>'npwp', ''),
                NULLIF(employee_record->>'bpjs_kesehatan', ''),
                NULLIF(employee_record->>'bpjs_ketenagakerjaan', ''),
                NULLIF(employee_record->>'agama', ''),
                NULLIF(employee_record->>'marital_status', ''),
                COALESCE(NULLIF(employee_record->>'dependents', '')::integer, 0),
                CASE WHEN employee_record ? 'address' THEN employee_record->'address' ELSE NULL END,
                CASE WHEN employee_record ? 'emergency_contacts' THEN employee_record->'emergency_contacts' ELSE NULL END,
                CASE WHEN employee_record ? 'education' THEN employee_record->'education' ELSE NULL END,
                CASE WHEN employee_record ? 'work_history' THEN employee_record->'work_history' ELSE NULL END,
                CASE WHEN employee_record ? 'bank_account' THEN employee_record->'bank_account' ELSE NULL END,
                COALESCE((employee_record->>'is_profile_completed')::boolean, FALSE),
                COALESCE((employee_record->>'is_verified')::boolean, FALSE),
                NULLIF(employee_record->>'verified_by', ''),
                NULLIF(employee_record->>'verified_at', '')::timestamptz,
                COALESCE((employee_record->>'is_locked')::boolean, FALSE),
                NULLIF(employee_record->>'managed_unit_id', ''),
                COALESCE(NULLIF(employee_record->>'gajiPokok', '')::numeric, 0),
                COALESCE(NULLIF(employee_record->>'tunjanganProfesi', '')::numeric, 0),
                NOW(),
                session_uuid
            )
            RETURNING * INTO inserted_employee;

            -- Add to existing arrays untuk prevent duplicate dalam batch yang sama
            IF emp_email IS NOT NULL THEN
                existing_emails := array_append(existing_emails, emp_email);
            END IF;
            IF emp_nik IS NOT NULL AND emp_nik <> '' THEN
                existing_niks := array_append(existing_niks, emp_nik);
            END IF;

            success_count := success_count + 1;

        EXCEPTION WHEN OTHERS THEN
            error_count := error_count + 1;
            errors := array_append(errors, jsonb_build_object(
                'row', row_number,
                'category', 'ERROR',
                'field', 'database',
                'message', SQLERRM,
                'data', employee_record
            ));
        END;
    END LOOP;

    -- Log import session
    UPDATE public.import_logs 
    SET total_rows = import_logs.total_rows + row_number, 
        success_count = import_logs.success_count + create_employees_batch.success_count, 
        skip_count = import_logs.skip_count + create_employees_batch.skip_count, 
        error_count = import_logs.error_count + create_employees_batch.error_count, 
        errors = (COALESCE(import_logs.errors, '[]'::jsonb) || to_jsonb(create_employees_batch.errors)),
        completed_at = NOW()
    WHERE id = session_uuid;

    -- Return summary
    RETURN jsonb_build_object(
        'sessionId', session_uuid,
        'total', row_number,
        'success', success_count,
        'skipped', skip_count,
        'errors', error_count,
        'details', errors,
        'allErrors', error_count > 0 OR skip_count > 0
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_employees_batch(jsonb, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_employees_batch(jsonb, uuid) TO anon;

-- ============================================================
-- Table: Import Logs (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.import_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    imported_by uuid REFERENCES auth.users(id),
    total_rows int NOT NULL DEFAULT 0,
    success_count int NOT NULL DEFAULT 0,
    skip_count int NOT NULL DEFAULT 0,
    error_count int NOT NULL DEFAULT 0,
    errors jsonb DEFAULT '[]'::jsonb,
    file_name text,
    file_size bigint,
    created_at timestamptz DEFAULT NOW(),
    completed_at timestamptz
);

-- Enable RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "import_logs_admin_all" ON public.import_logs;
CREATE POLICY "import_logs_admin_all" ON public.import_logs
    FOR ALL TO authenticated
    USING (public.is_admin_or_hr_user());

DROP POLICY IF EXISTS "import_logs_user_view_own" ON public.import_logs;
CREATE POLICY "import_logs_user_view_own" ON public.import_logs
    FOR SELECT TO authenticated
    USING (imported_by = auth.uid());

-- Add columns to employees table untuk tracking
ALTER TABLE public.employees 
    ADD COLUMN IF NOT EXISTS imported_at timestamptz,
    ADD COLUMN IF NOT EXISTS import_session_id uuid REFERENCES public.import_logs(id);

-- Index untuk performance
CREATE INDEX IF NOT EXISTS idx_employees_import_session ON public.employees(import_session_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_imported_by ON public.import_logs(imported_by);
CREATE INDEX IF NOT EXISTS idx_import_logs_created_at ON public.import_logs(created_at DESC);
