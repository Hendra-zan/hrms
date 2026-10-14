-- ============================================================
-- RPC FALLBACK: Admin/HR employee import bypassing RLS route issues
-- ============================================================
-- This function is SECURITY DEFINER so the import flow can keep working
-- even when the hosted API route is blocked by strict client-side RLS.

CREATE OR REPLACE FUNCTION public.is_admin_or_hr_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e."user_id" = auth.uid() AND e.role IN ('admin', 'hrd', 'hr')
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_or_hr_user() TO authenticated;

CREATE OR REPLACE FUNCTION public.create_employee_import(employee_data jsonb)
RETURNS public.employees
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  inserted_employee public.employees;
BEGIN
  IF NOT public.is_admin_or_hr_user() THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.employees (
    user_id,
    nik,
    nama,
    foto,
    jabatan,
    departemen,
    email,
    telepon,
    "hireDate",
    "birthDate",
    status,
    shift,
    "sisaCuti",
    role,
    spesialisasi,
    kredensial,
    "nomorSTR",
    "tanggalKadaluarsaSTR",
    "unitKerjaId",
    ktp_number,
    npwp,
    bpjs_kesehatan,
    bpjs_ketenagakerjaan,
    agama,
    marital_status,
    dependents,
    address,
    emergency_contacts,
    education,
    work_history,
    bank_account,
    is_profile_completed,
    is_verified,
    verified_by,
    verified_at,
    is_locked,
    managed_unit_id,
    "gajiPokok",
    "tunjanganProfesi"
  ) VALUES (
    NULLIF(employee_data->>'user_id', '')::uuid,
    NULLIF(employee_data->>'nik', ''),
    NULLIF(employee_data->>'nama', ''),
    NULLIF(employee_data->>'foto', ''),
    NULLIF(employee_data->>'jabatan', ''),
    NULLIF(employee_data->>'departemen', ''),
    NULLIF(employee_data->>'email', ''),
    NULLIF(employee_data->>'telepon', ''),
    NULLIF(employee_data->>'hireDate', '')::date,
    NULLIF(employee_data->>'birthDate', '')::date,
    COALESCE(NULLIF(employee_data->>'status', ''), 'Aktif'),
    NULLIF(employee_data->>'shift', ''),
    COALESCE(NULLIF(employee_data->>'sisaCuti', '')::integer, 12),
    COALESCE(NULLIF(employee_data->>'role', ''), 'karyawan'),
    NULLIF(employee_data->>'spesialisasi', ''),
    NULLIF(employee_data->>'kredensial', ''),
    NULLIF(employee_data->>'nomorSTR', ''),
    NULLIF(employee_data->>'tanggalKadaluarsaSTR', '')::date,
    NULLIF(employee_data->>'unitKerjaId', ''),
    NULLIF(employee_data->>'ktp_number', ''),
    NULLIF(employee_data->>'npwp', ''),
    COALESCE(NULLIF(employee_data->>'bpjs_kesehatan', ''), NULLIF(employee_data->>'bpjsKesehatan', '')),
    COALESCE(NULLIF(employee_data->>'bpjs_ketenagakerjaan', ''), NULLIF(employee_data->>'bpjsKetenagakerjaan', '')),
    NULLIF(employee_data->>'agama', ''),
    COALESCE(NULLIF(employee_data->>'marital_status', ''), NULLIF(employee_data->>'maritalStatus', '')),
    COALESCE(NULLIF(employee_data->>'dependents', '')::integer, 0),
    CASE WHEN employee_data ? 'address' THEN employee_data->'address' ELSE NULL END,
    COALESCE(employee_data->'emergency_contacts', employee_data->'emergencyContacts', '[]'::jsonb),
    CASE WHEN employee_data ? 'education' THEN employee_data->'education' ELSE NULL END,
    COALESCE(employee_data->'work_history', employee_data->'workHistory', '[]'::jsonb),
    COALESCE(employee_data->'bank_account', employee_data->'bankAccount'),
    COALESCE((employee_data->>'is_profile_completed')::boolean, (employee_data->>'isProfileCompleted')::boolean, FALSE),
    COALESCE((employee_data->>'is_verified')::boolean, (employee_data->>'isVerified')::boolean, FALSE),
    COALESCE(NULLIF(employee_data->>'verified_by', ''), NULLIF(employee_data->>'verifiedBy', '')),
    COALESCE(NULLIF(employee_data->>'verified_at', '')::timestamptz, NULLIF(employee_data->>'verifiedAt', '')::timestamptz),
    COALESCE((employee_data->>'is_locked')::boolean, (employee_data->>'isLocked')::boolean, FALSE),
    COALESCE(NULLIF(employee_data->>'managed_unit_id', ''), NULLIF(employee_data->>'managedUnitId', '')),
    COALESCE(NULLIF(employee_data->>'gajiPokok', '')::numeric, 0),
    COALESCE(NULLIF(employee_data->>'tunjanganProfesi', '')::numeric, 0)
  )
  RETURNING * INTO inserted_employee;

  RETURN inserted_employee;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_employee_import(jsonb) TO authenticated;
