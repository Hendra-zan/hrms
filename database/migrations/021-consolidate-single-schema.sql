-- Consolidate legacy snake_case schema into the canonical camelCase schema used by the app.
-- Run only after taking a backup or export. This script preserves data by renaming columns in place.
-- It is safe to run on an already-consolidated database because each rename is guarded.

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'hire_date'
    ) THEN
        ALTER TABLE public.employees RENAME COLUMN hire_date TO "hireDate";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'birth_date'
    ) THEN
        ALTER TABLE public.employees RENAME COLUMN birth_date TO "birthDate";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'sisa_cuti'
    ) THEN
        ALTER TABLE public.employees RENAME COLUMN sisa_cuti TO "sisaCuti";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'nomor_str'
    ) THEN
        ALTER TABLE public.employees RENAME COLUMN nomor_str TO "nomorSTR";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'tanggal_kadaluarsa_str'
    ) THEN
        ALTER TABLE public.employees RENAME COLUMN tanggal_kadaluarsa_str TO "tanggalKadaluarsaSTR";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'gaji_pokok'
    ) THEN
        ALTER TABLE public.employees RENAME COLUMN gaji_pokok TO "gajiPokok";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employees' AND column_name = 'tunjangan_profesi'
    ) THEN
        ALTER TABLE public.employees RENAME COLUMN tunjangan_profesi TO "tunjanganProfesi";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'employee_id'
    ) THEN
        ALTER TABLE public.attendance RENAME COLUMN employee_id TO "employeeId";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'date'
    ) THEN
        ALTER TABLE public.attendance RENAME COLUMN date TO tanggal;
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'check_in'
    ) THEN
        ALTER TABLE public.attendance RENAME COLUMN check_in TO "clockIn";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'check_out'
    ) THEN
        ALTER TABLE public.attendance RENAME COLUMN check_out TO "clockOut";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'is_late'
    ) THEN
        ALTER TABLE public.attendance RENAME COLUMN is_late TO "isLate";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'overtime_hours'
    ) THEN
        ALTER TABLE public.attendance RENAME COLUMN overtime_hours TO "overtimeHours";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'employee_id'
    ) THEN
        ALTER TABLE public.requests RENAME COLUMN employee_id TO "employeeId";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'start_date'
    ) THEN
        ALTER TABLE public.requests RENAME COLUMN start_date TO "startDate";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'end_date'
    ) THEN
        ALTER TABLE public.requests RENAME COLUMN end_date TO "endDate";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'approved_by'
    ) THEN
        ALTER TABLE public.requests RENAME COLUMN approved_by TO "approvedBy";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'approved_at'
    ) THEN
        ALTER TABLE public.requests RENAME COLUMN approved_at TO "approvedAt";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'requested_at'
    ) THEN
        ALTER TABLE public.requests RENAME COLUMN requested_at TO "requestedAt";
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'requests' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.requests RENAME COLUMN created_at TO "requestedAt";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'employee_id'
    ) THEN
        ALTER TABLE public.documents RENAME COLUMN employee_id TO "employeeId";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_url'
    ) THEN
        ALTER TABLE public.documents RENAME COLUMN file_url TO "fileUrl";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_at'
    ) THEN
        ALTER TABLE public.documents RENAME COLUMN uploaded_at TO "uploadedAt";
    END IF;

    -- Rename device_id in attendance
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'device_id'
    ) THEN
        ALTER TABLE public.attendance RENAME COLUMN device_id TO "deviceId";
    END IF;

    -- Rename columns in employee_devices
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employee_devices' AND column_name = 'employee_id'
    ) THEN
        ALTER TABLE public.employee_devices RENAME COLUMN employee_id TO "employeeId";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employee_devices' AND column_name = 'device_id'
    ) THEN
        ALTER TABLE public.employee_devices RENAME COLUMN device_id TO "deviceId";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employee_devices' AND column_name = 'device_name'
    ) THEN
        ALTER TABLE public.employee_devices RENAME COLUMN device_name TO "deviceName";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employee_devices' AND column_name = 'device_fingerprint'
    ) THEN
        ALTER TABLE public.employee_devices RENAME COLUMN device_fingerprint TO "deviceFingerprint";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employee_devices' AND column_name = 'face_data'
    ) THEN
        ALTER TABLE public.employee_devices RENAME COLUMN face_data TO "faceData";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employee_devices' AND column_name = 'biometric_enabled'
    ) THEN
        ALTER TABLE public.employee_devices RENAME COLUMN biometric_enabled TO "biometricEnabled";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employee_devices' AND column_name = 'is_primary'
    ) THEN
        ALTER TABLE public.employee_devices RENAME COLUMN is_primary TO "isPrimary";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employee_devices' AND column_name = 'registered_at'
    ) THEN
        ALTER TABLE public.employee_devices RENAME COLUMN registered_at TO "registeredAt";
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'employee_devices' AND column_name = 'last_used_at'
    ) THEN
        ALTER TABLE public.employee_devices RENAME COLUMN last_used_at TO "lastUsedAt";
    END IF;

    -- Rename biometric_verified in attendance
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'attendance' AND column_name = 'biometric_verified'
    ) THEN
        ALTER TABLE public.attendance RENAME COLUMN biometric_verified TO "biometricVerified";
    END IF;

END $$;

-- Ensure the canonical master tables exist.
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    nama VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.positions (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    nama VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    hospital_name VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMIT;
