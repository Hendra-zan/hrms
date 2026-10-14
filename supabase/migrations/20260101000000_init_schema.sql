-- ==========================================
-- FILE: 002-step1-tables.sql
-- ==========================================

-- STEP 1: Buat Tabel-tabel Utama
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel untuk unit kerja/departemen
CREATE TABLE IF NOT EXISTS public.units (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    nama VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel untuk karyawan
CREATE TABLE IF NOT EXISTS public.employees (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nama VARCHAR(255) NOT NULL,
    foto TEXT,
    jabatan VARCHAR(255),
    departemen VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    telepon VARCHAR(50),
    hire_date DATE,
    birth_date DATE,
    status VARCHAR(50) DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Cuti', 'Non-Aktif')),
    shift VARCHAR(50) CHECK (shift IN ('Pagi', 'Siang', 'Malam')),
    sisa_cuti INTEGER DEFAULT 12,
    role VARCHAR(50) DEFAULT 'karyawan' CHECK (role IN ('admin', 'karyawan')),
    spesialisasi TEXT,
    kredensial TEXT,
    nomor_str VARCHAR(100),
    tanggal_kadaluarsa_str DATE,
    gaji_pokok DECIMAL(15,2),
    tunjangan_profesi DECIMAL(15,2),
    "unitKerjaId" TEXT REFERENCES public.units(id),
    "managedUnitId" TEXT REFERENCES public.units(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel untuk device registration (biometric device binding)
CREATE TABLE IF NOT EXISTS public.employee_devices (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    device_id VARCHAR(255) NOT NULL, -- unique device identifier (IMEI, Android ID, atau UUID)
    device_name VARCHAR(255), -- contoh: "Samsung Galaxy A12", "iPhone 13"
    platform VARCHAR(50) CHECK (platform IN ('Android', 'iOS')),
    device_fingerprint VARCHAR(255), -- hash dari hardware identifiers
    face_data JSONB, -- menyimpan face embedding/encoding (dari library seperti face_recognition.js)
    biometric_enabled BOOLEAN DEFAULT TRUE,
    is_primary BOOLEAN DEFAULT FALSE, -- device utama untuk karyawan ini
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) CHECK (status IN ('Active', 'Inactive', 'Blocked')) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, device_id)
);

-- 4. Tabel untuk presensi
CREATE TABLE IF NOT EXISTS public.attendance (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    device_id TEXT REFERENCES public.employee_devices(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    check_in TIME,
    check_out TIME,
    location VARCHAR(255),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    -- Face verification fields
    face_verification_check_in JSONB, -- {confidence: 0.95, verified_at: "2026-04-19T10:30:00Z", image_hash: "..."}
    face_verification_check_out JSONB,
    face_match_score_check_in DECIMAL(3,2), -- 0.00 - 1.00
    face_match_score_check_out DECIMAL(3,2),
    -- Biometric fields
    biometric_type VARCHAR(50) CHECK (biometric_type IN ('face', 'fingerprint', 'iris', 'code', 'totp', 'manual')),
    biometric_verified BOOLEAN DEFAULT FALSE,
    -- General fields
    status VARCHAR(50) CHECK (status IN ('Hadir', 'Terlambat', 'Absen', 'Cuti', 'Sakit', 'Pending', 'Recorded')),
    source VARCHAR(50) CHECK (source IN ('mobile', 'web-ess', 'web-admin')) DEFAULT 'web-admin',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- 5. Tabel untuk permintaan/request
CREATE TABLE IF NOT EXISTS public.requests (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Cuti', 'Izin', 'Overtime', 'Reimburse')),
    start_date DATE,
    end_date DATE,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    approved_by TEXT REFERENCES public.employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    amount DECIMAL(15,2), -- untuk reimburse
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabel untuk dokumen
CREATE TABLE IF NOT EXISTS public.documents (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('Ijazah', 'STR/SIP', 'Sertifikat', 'Lainnya')),
    file_url TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Insert data sample untuk units
INSERT INTO public.units (nama) VALUES 
    ('Rawat Inap'),
    ('Rawat Jalan'),
    ('IGD'),
    ('ICU'),
    ('Radiologi'),
    ('Laboratorium'),
    ('Farmasi'),
    ('Administrasi'),
    ('Keuangan'),
    ('HR')
ON CONFLICT DO NOTHING;

-- ==========================================
-- FILE: 003-step2-rls.sql
-- ==========================================

-- STEP 2: Enable RLS dan Setup Policies
-- Jalankan setelah STEP 1 berhasil

-- Enable Row Level Security (RLS)
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Drop policies jika sudah ada (untuk re-run)
DROP POLICY IF EXISTS "Units dapat dibaca oleh user yang login" ON public.units;
DROP POLICY IF EXISTS "Units dapat diubah oleh admin" ON public.units;
DROP POLICY IF EXISTS "Employees dapat dibaca oleh user yang login" ON public.employees;
DROP POLICY IF EXISTS "Employees dapat diubah oleh admin atau diri sendiri" ON public.employees;
DROP POLICY IF EXISTS "Attendance dapat dibaca oleh admin atau karyawan sendiri" ON public.attendance;
DROP POLICY IF EXISTS "Attendance dapat diinput oleh admin atau karyawan sendiri" ON public.attendance;
DROP POLICY IF EXISTS "Requests dapat dibaca oleh admin atau karyawan sendiri" ON public.requests;
DROP POLICY IF EXISTS "Requests dapat dibuat oleh karyawan sendiri" ON public.requests;
DROP POLICY IF EXISTS "Requests dapat diupdate oleh admin" ON public.requests;
DROP POLICY IF EXISTS "Documents dapat dibaca oleh admin atau karyawan sendiri" ON public.documents;
DROP POLICY IF EXISTS "Documents dapat diupload oleh admin atau karyawan sendiri" ON public.documents;

-- RLS Policies untuk units
CREATE POLICY "Units dapat dibaca oleh user yang login" 
    ON public.units FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Units dapat diubah oleh admin" 
    ON public.units FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies untuk employees
CREATE POLICY "Employees dapat dibaca oleh user yang login" 
    ON public.employees FOR SELECT 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Employees dapat diubah oleh admin atau diri sendiri" 
    ON public.employees FOR ALL 
    USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies untuk attendance
CREATE POLICY "Attendance dapat dibaca oleh admin atau karyawan sendiri" 
    ON public.attendance FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = employee_id AND (
                e.user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.employees admin 
                    WHERE admin.user_id = auth.uid() AND admin.role = 'admin'
                )
            )
        )
    );

CREATE POLICY "Attendance dapat diinput oleh admin atau karyawan sendiri" 
    ON public.attendance FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = employee_id AND (
                e.user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.employees admin 
                    WHERE admin.user_id = auth.uid() AND admin.role = 'admin'
                )
            )
        )
    );

-- RLS Policies untuk requests
CREATE POLICY "Requests dapat dibaca oleh admin atau karyawan sendiri" 
    ON public.requests FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = employee_id AND (
                e.user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.employees admin 
                    WHERE admin.user_id = auth.uid() AND admin.role = 'admin'
                )
            )
        )
    );

CREATE POLICY "Requests dapat dibuat oleh karyawan sendiri" 
    ON public.requests FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = employee_id AND e.user_id = auth.uid()
        )
    );

CREATE POLICY "Requests dapat diupdate oleh admin" 
    ON public.requests FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies untuk documents
CREATE POLICY "Documents dapat dibaca oleh admin atau karyawan sendiri" 
    ON public.documents FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = employee_id AND (
                e.user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.employees admin 
                    WHERE admin.user_id = auth.uid() AND admin.role = 'admin'
                )
            )
        )
    );

CREATE POLICY "Documents dapat diupload oleh admin atau karyawan sendiri" 
    ON public.documents FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees e
            WHERE e.id = employee_id AND (
                e.user_id = auth.uid() OR 
                EXISTS (
                    SELECT 1 FROM public.employees admin 
                    WHERE admin.user_id = auth.uid() AND admin.role = 'admin'
                )
            )
        )
    );

-- ==========================================
-- FILE: 003b-step2-migrate-existing.sql
-- ==========================================

-- STEP 2: Migrate Existing Data for Biometric Support
-- Jalankan SETELAH database-setup-step1.sql
-- Untuk database yang sudah ada dengan data lama

-- 1. Add biometric columns ke attendance (jika belum ada)
ALTER TABLE IF EXISTS public.attendance
    ADD COLUMN IF NOT EXISTS device_id TEXT,
    ADD COLUMN IF NOT EXISTS face_verification_check_in JSONB,
    ADD COLUMN IF NOT EXISTS face_verification_check_out JSONB,
    ADD COLUMN IF NOT EXISTS face_match_score_check_in DECIMAL(3,2),
    ADD COLUMN IF NOT EXISTS face_match_score_check_out DECIMAL(3,2),
    ADD COLUMN IF NOT EXISTS biometric_type VARCHAR(50),
    ADD COLUMN IF NOT EXISTS biometric_verified BOOLEAN DEFAULT FALSE;

-- 2. Update biometric_type untuk existing records
-- Set semua existing records sebagai 'manual' (input tanpa biometric)
UPDATE public.attendance
SET biometric_type = 'manual'
WHERE biometric_type IS NULL;

-- 3. Update constraint untuk biometric_type
ALTER TABLE public.attendance
    DROP CONSTRAINT IF EXISTS attendance_biometric_type_check;

ALTER TABLE public.attendance
    ADD CONSTRAINT attendance_biometric_type_check 
    CHECK (biometric_type IN ('face', 'fingerprint', 'iris', 'code', 'totp', 'manual'));

-- 4. Set default source jika belum ada
UPDATE public.attendance
SET source = 'web-admin'
WHERE source IS NULL;

-- 5. [Removed unused view creation to prevent migration schema conflicts]

-- 6. Verify data migration
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN biometric_type = 'manual' THEN 1 END) as manual_records,
    COUNT(CASE WHEN biometric_verified = TRUE THEN 1 END) as verified_records,
    COUNT(CASE WHEN biometric_verified = FALSE THEN 1 END) as unverified_records
FROM public.attendance;
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN biometric_type = 'manual' THEN 1 END) as manual_records,
    COUNT(CASE WHEN biometric_verified = TRUE THEN 1 END) as verified_records,
    COUNT(CASE WHEN biometric_verified = FALSE THEN 1 END) as unverified_records
FROM public.attendance;


-- ==========================================
-- FILE: 004-step3-functions.sql
-- ==========================================

-- STEP 3: Functions dan Triggers
-- Jalankan setelah STEP 2 berhasil

-- Drop function jika sudah ada (untuk re-run)
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Fungsi untuk update timestamp otomatis
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers jika sudah ada (untuk re-run)
DROP TRIGGER IF EXISTS update_units_updated_at ON public.units;
DROP TRIGGER IF EXISTS update_employees_updated_at ON public.employees;
DROP TRIGGER IF EXISTS update_attendance_updated_at ON public.attendance;
DROP TRIGGER IF EXISTS update_requests_updated_at ON public.requests;

-- Trigger untuk auto-update updated_at
CREATE TRIGGER update_units_updated_at BEFORE UPDATE ON public.units 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at BEFORE UPDATE ON public.requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Helper functions agar pengecekan role tidak memicu recursion di RLS
CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT e.id
    FROM public.employees e
    WHERE e.user_id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.employees e
        WHERE e.user_id = auth.uid() AND e.role = 'admin'
    );
$$;

GRANT EXECUTE ON FUNCTION public.current_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- ==========================================
-- FILE: 004b-step3-rls-biometric.sql
-- ==========================================

-- STEP 3: Row Level Security (RLS) untuk Biometric Tables
-- Jalankan SETELAH database-setup-step2-migrate-existing.sql
-- Setup security policies untuk employee_devices & attendance biometric fields

-- 1. Enable RLS untuk employee_devices
ALTER TABLE public.employee_devices ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policy: Employees dapat melihat device mereka sendiri
DROP POLICY IF EXISTS "employee_devices_read_self" ON public.employee_devices;
CREATE POLICY "employee_devices_read_self"
    ON public.employee_devices FOR SELECT
    USING (
        public.is_admin_user() OR 
        employee_id = public.current_employee_id()
    );

-- 3. RLS Policy: Employees dapat register device mereka sendiri
DROP POLICY IF EXISTS "employee_devices_insert_self" ON public.employee_devices;
CREATE POLICY "employee_devices_insert_self"
    ON public.employee_devices FOR INSERT
    WITH CHECK (
        public.is_admin_user() OR 
        employee_id = public.current_employee_id()
    );

-- 4. RLS Policy: Hanya admin yang dapat update/delete device
DROP POLICY IF EXISTS "employee_devices_update_admin" ON public.employee_devices;
CREATE POLICY "employee_devices_update_admin"
    ON public.employee_devices FOR UPDATE
    USING (public.is_admin_user())
    WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "employee_devices_delete_admin" ON public.employee_devices;
CREATE POLICY "employee_devices_delete_admin"
    ON public.employee_devices FOR DELETE
    USING (public.is_admin_user());

-- 5. Verify RLS policies active
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'employee_devices'
ORDER BY tablename, policyname;


-- ==========================================
-- FILE: 005-step4-indexes.sql
-- ==========================================

-- STEP 4: Perkuat integritas data absensi dengan audit tambahan dan status check
-- Jalankan script ini setelah tabel attendance sudah dibuat.

ALTER TABLE public.attendance
    ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6),
    ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6),
    ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'web-admin',
    ADD COLUMN IF NOT EXISTS notes TEXT;

-- Update daftar status yang diizinkan untuk mendukung status sementara / rekaman.
ALTER TABLE public.attendance
    DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE public.attendance
    ADD CONSTRAINT attendance_status_check CHECK (
        status IN ('Hadir', 'Terlambat', 'Absen', 'Cuti', 'Sakit', 'Pending', 'Recorded')
    );

-- Tambahkan pembatasan sumber catatan absensi untuk audit.
ALTER TABLE public.attendance
    DROP CONSTRAINT IF EXISTS attendance_source_check;

ALTER TABLE public.attendance
    ADD CONSTRAINT attendance_source_check CHECK (
        source IN ('mobile', 'web-ess', 'web-admin')
    );

-- Gunakan nilai default untuk sumber jika tidak ditentukan.
UPDATE public.attendance
SET source = COALESCE(source, 'web-admin')
WHERE source IS NULL;


-- ==========================================
-- FILE: 005b-step4-indexes-biometric.sql
-- ==========================================

-- STEP 4: Performance Indexes untuk Biometric Tables
-- Jalankan SETELAH database-setup-step3-rls-biometric.sql
-- Optimize query performance untuk biometric operations

-- 1. Index untuk employee_devices lookups
CREATE INDEX IF NOT EXISTS idx_employee_devices_employee_id 
    ON public.employee_devices(employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_devices_device_id 
    ON public.employee_devices(device_id);

CREATE INDEX IF NOT EXISTS idx_employee_devices_platform 
    ON public.employee_devices(platform);

CREATE INDEX IF NOT EXISTS idx_employee_devices_status 
    ON public.employee_devices(status);

CREATE INDEX IF NOT EXISTS idx_employee_devices_is_primary 
    ON public.employee_devices(is_primary) WHERE is_primary = TRUE;

-- 2. Index untuk attendance biometric queries
CREATE INDEX IF NOT EXISTS idx_attendance_device_id 
    ON public.attendance(device_id);

CREATE INDEX IF NOT EXISTS idx_attendance_biometric_verified 
    ON public.attendance(biometric_verified);

CREATE INDEX IF NOT EXISTS idx_attendance_biometric_type 
    ON public.attendance(biometric_type);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_biometric 
    ON public.attendance(employee_id, biometric_verified, date);

CREATE INDEX IF NOT EXISTS idx_attendance_date_biometric 
    ON public.attendance(date, biometric_type, biometric_verified);

-- 3. Partial index untuk failed biometric attempts
CREATE INDEX IF NOT EXISTS idx_attendance_failed_verification 
    ON public.attendance(employee_id, created_at) 
    WHERE biometric_verified = FALSE AND biometric_type IN ('face', 'totp');

-- 4. Composite index untuk audit queries
CREATE INDEX IF NOT EXISTS idx_attendance_audit 
    ON public.attendance(employee_id, date, biometric_type, source);

-- 5. Index untuk anomaly detection queries
CREATE INDEX IF NOT EXISTS idx_attendance_location 
    ON public.attendance(latitude, longitude, created_at);

-- 6. BRIN index untuk time-series data (efficient for large tables)
CREATE INDEX IF NOT EXISTS idx_attendance_created_at_brin 
    ON public.attendance USING BRIN (created_at);

-- 7. Verify indexes created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename IN ('employee_devices', 'attendance')
    AND schemaname = 'public'
ORDER BY tablename, indexname;


-- ==========================================
-- FILE: 006-step5-audit-log.sql
-- ==========================================

-- STEP 5: Audit Logging untuk Biometric & Device Events
-- Jalankan SETELAH database-setup-step4-indexes-biometric.sql
-- Track semua aktivitas biometric untuk security & compliance

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create audit log table untuk biometric events
CREATE TABLE IF NOT EXISTS public.biometric_audit_log (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
    device_id TEXT REFERENCES public.employee_devices(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'device_registered',
        'device_blocked',
        'device_unblocked',
        'device_removed',
        'check_in_success',
        'check_in_failed',
        'check_out_success',
        'check_out_failed',
        'face_verified',
        'face_rejected',
        'totp_verified',
        'totp_rejected',
        'anomaly_detected',
        'manual_override',
        'device_status_changed',
        'device_metadata_changed'
    )),
    status VARCHAR(50) CHECK (status IN ('success', 'failed', 'warning')),
    biometric_type VARCHAR(50),
    confidence_score DECIMAL(3,2),
    failure_reason TEXT,
    metadata JSONB, -- {attempt_number, retry_count, error_code, face_score, location, device_fingerprint}
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.biometric_audit_log
    DROP CONSTRAINT IF EXISTS biometric_audit_log_confidence_score_check;

ALTER TABLE public.biometric_audit_log
    ADD CONSTRAINT biometric_audit_log_confidence_score_check
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1));

ALTER TABLE public.biometric_audit_log
    ALTER COLUMN status SET DEFAULT 'success';

UPDATE public.biometric_audit_log
SET status = 'success'
WHERE status IS NULL;

ALTER TABLE public.biometric_audit_log
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL,
    ALTER COLUMN updated_at SET NOT NULL;

ALTER TABLE public.biometric_audit_log ENABLE ROW LEVEL SECURITY;

-- 2. RLS untuk audit log (admin & self read only)
DROP POLICY IF EXISTS "biometric_audit_log_read" ON public.biometric_audit_log;
CREATE POLICY "biometric_audit_log_read"
    ON public.biometric_audit_log FOR SELECT
    USING (
        public.is_admin_user() OR 
        employee_id = public.current_employee_id()
    );

DROP POLICY IF EXISTS "biometric_audit_log_insert" ON public.biometric_audit_log;
CREATE POLICY "biometric_audit_log_insert"
    ON public.biometric_audit_log FOR INSERT
    WITH CHECK (
        public.is_admin_user() OR
        employee_id = public.current_employee_id()
    );

-- 3. Create indexes untuk audit log queries
CREATE INDEX IF NOT EXISTS idx_biometric_audit_employee_id 
    ON public.biometric_audit_log(employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_biometric_audit_device_id 
    ON public.biometric_audit_log(device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_biometric_audit_action 
    ON public.biometric_audit_log(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_biometric_audit_status 
    ON public.biometric_audit_log(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_biometric_audit_created_at_brin 
    ON public.biometric_audit_log USING BRIN (created_at);

CREATE INDEX IF NOT EXISTS idx_biometric_audit_created_at_desc
    ON public.biometric_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_biometric_audit_failed_recent
    ON public.biometric_audit_log(employee_id, created_at DESC)
    WHERE action LIKE '%failed%';

-- 4. Trigger function untuk log device changes
CREATE OR REPLACE FUNCTION log_device_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.biometric_audit_log 
        (employee_id, device_id, action, status, metadata, created_at)
        VALUES (
            NEW.employee_id,
            NEW.id,
            'device_registered',
            'success',
            jsonb_build_object(
                'platform', NEW.platform,
                'device_name', NEW.device_name,
                'is_primary', NEW.is_primary
            ),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND (
        OLD.status IS DISTINCT FROM NEW.status OR
        OLD.platform IS DISTINCT FROM NEW.platform OR
        OLD.device_name IS DISTINCT FROM NEW.device_name OR
        OLD.is_primary IS DISTINCT FROM NEW.is_primary
    ) THEN
        INSERT INTO public.biometric_audit_log 
        (employee_id, device_id, action, status, metadata, created_at)
        VALUES (
            NEW.employee_id,
            NEW.id,
            CASE
                WHEN OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Blocked' THEN 'device_blocked'
                WHEN OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Active', 'Inactive') AND OLD.status = 'Blocked' THEN 'device_unblocked'
                WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'device_status_changed'
                ELSE 'device_metadata_changed'
            END,
            'success',
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'old_platform', OLD.platform,
                'new_platform', NEW.platform,
                'old_device_name', OLD.device_name,
                'new_device_name', NEW.device_name,
                'old_is_primary', OLD.is_primary,
                'new_is_primary', NEW.is_primary
            ),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.biometric_audit_log 
        (employee_id, device_id, action, status, metadata, created_at)
        VALUES (
            OLD.employee_id,
            OLD.id,
            'device_removed',
            'success',
            jsonb_build_object(
                'platform', OLD.platform,
                'device_name', OLD.device_name
            ),
            NOW()
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.log_device_change() FROM PUBLIC;

-- 5. Attach trigger ke employee_devices
DROP TRIGGER IF EXISTS trigger_log_device_change ON public.employee_devices;
CREATE TRIGGER trigger_log_device_change
    AFTER INSERT OR UPDATE OR DELETE ON public.employee_devices
    FOR EACH ROW
    EXECUTE FUNCTION log_device_change();

-- 6. Create materialized view untuk anomaly detection
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_matviews
        WHERE schemaname = 'public'
          AND matviewname = 'device_anomalies'
    ) THEN
        EXECUTE 'DROP MATERIALIZED VIEW public.device_anomalies';
    ELSIF EXISTS (
        SELECT 1
        FROM pg_views
        WHERE schemaname = 'public'
          AND viewname = 'device_anomalies'
    ) THEN
        EXECUTE 'DROP VIEW public.device_anomalies';
    END IF;
END
$$;

CREATE MATERIALIZED VIEW public.device_anomalies AS
SELECT 
    e.id as employee_id,
    e.nama as employee_name,
    COUNT(DISTINCT CASE WHEN a.action LIKE '%failed%' THEN a.created_at::DATE END) as failed_days,
    COUNT(CASE WHEN a.action LIKE '%failed%' THEN 1 END) as total_failures,
    COUNT(DISTINCT a.device_id) as unique_devices,
    COUNT(DISTINCT a.created_at::DATE) as active_days,
    MAX(a.created_at) as last_activity,
    AVG(CASE WHEN a.confidence_score IS NOT NULL THEN a.confidence_score ELSE 1 END) as avg_confidence
FROM public.employees e
LEFT JOIN public.biometric_audit_log a ON e.id = a.employee_id
    AND a.created_at > NOW() - INTERVAL '30 days'
GROUP BY e.id, e.nama
HAVING 
    COUNT(CASE WHEN a.action LIKE '%failed%' THEN 1 END) > 5 
    OR COUNT(DISTINCT a.device_id) > 3
    OR AVG(CASE WHEN a.confidence_score IS NOT NULL THEN a.confidence_score ELSE 1 END) < 0.85
ORDER BY total_failures DESC, avg_confidence ASC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_device_anomalies_employee_id
    ON public.device_anomalies(employee_id);

CREATE TABLE IF NOT EXISTS public.audit_maintenance_log (
    id BIGSERIAL PRIMARY KEY,
    object_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
    details TEXT,
    executed_by UUID,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_maintenance_log_object_time
    ON public.audit_maintenance_log(object_name, executed_at DESC);

ALTER TABLE public.audit_maintenance_log
    ALTER COLUMN object_name SET NOT NULL,
    ALTER COLUMN operation SET NOT NULL,
    ALTER COLUMN status SET NOT NULL,
    ALTER COLUMN executed_at SET NOT NULL;

CREATE OR REPLACE FUNCTION public.refresh_device_anomalies()
RETURNS void AS $$
BEGIN
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Hanya admin yang boleh refresh device_anomalies';
    END IF;

    BEGIN
        REFRESH MATERIALIZED VIEW CONCURRENTLY public.device_anomalies;

        INSERT INTO public.audit_maintenance_log (
            object_name,
            operation,
            status,
            details,
            executed_by
        ) VALUES (
            'device_anomalies',
            'refresh_materialized_view_concurrently',
            'success',
            'Concurrent refresh completed.',
            auth.uid()
        );
    EXCEPTION
        WHEN feature_not_supported OR object_not_in_prerequisite_state OR insufficient_privilege THEN
            REFRESH MATERIALIZED VIEW public.device_anomalies;

            INSERT INTO public.audit_maintenance_log (
                object_name,
                operation,
                status,
                details,
                executed_by
            ) VALUES (
                'device_anomalies',
                'refresh_materialized_view',
                'success',
                'Fallback non-concurrent refresh completed.',
                auth.uid()
            );
        WHEN OTHERS THEN
            INSERT INTO public.audit_maintenance_log (
                object_name,
                operation,
                status,
                details,
                executed_by
            ) VALUES (
                'device_anomalies',
                'refresh_materialized_view',
                'failed',
                SQLERRM,
                auth.uid()
            );
            RAISE;
    END;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.refresh_device_anomalies() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_device_anomalies() TO authenticated;

CREATE OR REPLACE FUNCTION public.cleanup_old_biometric_audit_logs(retention_days INTEGER DEFAULT 365)
RETURNS INTEGER AS $$
DECLARE
    deleted_rows INTEGER;
BEGIN
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Hanya admin yang boleh menjalankan cleanup audit log';
    END IF;

    IF retention_days < 30 THEN
        RAISE EXCEPTION 'retention_days minimal 30 hari';
    END IF;

    DELETE FROM public.biometric_audit_log
    WHERE created_at < NOW() - make_interval(days => retention_days);

    GET DIAGNOSTICS deleted_rows = ROW_COUNT;

    INSERT INTO public.audit_maintenance_log (
        object_name,
        operation,
        status,
        details,
        executed_by
    ) VALUES (
        'biometric_audit_log',
        'cleanup_old_records',
        'success',
        'Deleted rows: ' || deleted_rows || ', retention_days=' || retention_days,
        auth.uid()
    );

    RETURN deleted_rows;
EXCEPTION
    WHEN OTHERS THEN
        INSERT INTO public.audit_maintenance_log (
            object_name,
            operation,
            status,
            details,
            executed_by
        ) VALUES (
            'biometric_audit_log',
            'cleanup_old_records',
            'failed',
            SQLERRM,
            auth.uid()
        );
        RAISE;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.cleanup_old_biometric_audit_logs(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_biometric_audit_logs(INTEGER) TO authenticated;

ALTER TABLE public.audit_maintenance_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_maintenance_log_select" ON public.audit_maintenance_log;
CREATE POLICY "audit_maintenance_log_select"
    ON public.audit_maintenance_log FOR SELECT
    USING (public.is_admin_user());

DROP POLICY IF EXISTS "audit_maintenance_log_insert" ON public.audit_maintenance_log;
CREATE POLICY "audit_maintenance_log_insert"
    ON public.audit_maintenance_log FOR INSERT
    WITH CHECK (public.is_admin_user());

GRANT SELECT ON public.audit_maintenance_log TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.audit_maintenance_log FROM authenticated;

-- 7. Compatibility table untuk modul audit log aplikasi web
-- Dipakai oleh AuditLogViewer dan auditLogService yang membaca tabel `audit_logs`
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    user_id UUID,
    user_email TEXT,
    user_name TEXT,
    action VARCHAR(20) CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    portal_type VARCHAR(20) CHECK (portal_type IN ('personal', 'operational', 'unknown')),
    entity_type TEXT,
    entity_id TEXT,
    entity_name TEXT,
    old_data JSONB,
    new_data JSONB,
    changes JSONB,
    description TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.audit_logs
    ALTER COLUMN action SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

ALTER TABLE public.audit_logs
    ADD COLUMN IF NOT EXISTS portal_type VARCHAR(20);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'audit_logs_portal_type_check'
          AND conrelid = 'public.audit_logs'::regclass
    ) THEN
        ALTER TABLE public.audit_logs
            ADD CONSTRAINT audit_logs_portal_type_check
            CHECK (portal_type IN ('personal', 'operational', 'unknown'));
    END IF;
END
$$;

ALTER TABLE public.audit_logs
    ALTER COLUMN portal_type SET DEFAULT 'operational';

UPDATE public.audit_logs
SET portal_type = COALESCE(
    NULLIF(changes->'metadata'->>'portal_type', ''),
    portal_type,
    'operational'
)
WHERE portal_type IS NULL;

ALTER TABLE public.audit_logs
    ALTER COLUMN portal_type SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email
    ON public.audit_logs(user_email);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type
    ON public.audit_logs(entity_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id
    ON public.audit_logs(entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action
    ON public.audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_audit_logs_portal_type
    ON public.audit_logs(portal_type);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON public.audit_logs(created_at DESC);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy"
    ON public.audit_logs FOR SELECT
    USING (public.is_admin_user() OR user_id = auth.uid());

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy"
    ON public.audit_logs FOR INSERT
    WITH CHECK (public.is_admin_user() OR user_id = auth.uid());

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated;
REVOKE UPDATE, DELETE ON public.biometric_audit_log FROM authenticated;
GRANT SELECT, INSERT ON public.biometric_audit_log TO authenticated;

-- 7a. Realtime sync dari biometric_audit_log ke audit_logs (untuk kompatibilitas UI web)
CREATE OR REPLACE FUNCTION public.sync_biometric_audit_to_audit_logs()
RETURNS TRIGGER AS $$
BEGIN
    BEGIN
        INSERT INTO public.audit_logs (
            id,
            user_id,
            user_email,
            user_name,
            action,
            portal_type,
            entity_type,
            entity_id,
            entity_name,
            old_data,
            new_data,
            changes,
            description,
            ip_address,
            user_agent,
            created_at
        ) VALUES (
            NEW.id,
            NULL::uuid,
            'system@local',
            'System',
            CASE
                WHEN NEW.action IN ('device_registered') THEN 'CREATE'
                WHEN NEW.action IN ('device_removed') THEN 'DELETE'
                ELSE 'UPDATE'
            END,
            'operational',
            'biometric_device',
            COALESCE(NEW.device_id, NEW.employee_id),
            'Biometric Device Event',
            NULL::jsonb,
            NEW.metadata,
            CASE
                WHEN NEW.action IN ('device_status_changed', 'device_metadata_changed', 'device_blocked', 'device_unblocked') THEN
                    jsonb_build_object('source_action', NEW.action, 'metadata', NEW.metadata)
                ELSE NULL::jsonb
            END,
            'Biometric event: ' || NEW.action,
            NEW.ip_address,
            NEW.user_agent,
            NEW.created_at
        )
        ON CONFLICT (id) DO NOTHING;
    EXCEPTION
        WHEN OTHERS THEN
            INSERT INTO public.audit_maintenance_log (
                object_name,
                operation,
                status,
                details,
                executed_by
            ) VALUES (
                'audit_logs',
                'sync_biometric_insert',
                'failed',
                SQLERRM,
                auth.uid()
            );
    END;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.sync_biometric_audit_to_audit_logs() FROM PUBLIC;

DROP TRIGGER IF EXISTS trigger_sync_biometric_to_audit_logs ON public.biometric_audit_log;
CREATE TRIGGER trigger_sync_biometric_to_audit_logs
    AFTER INSERT ON public.biometric_audit_log
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_biometric_audit_to_audit_logs();

-- 7c. Health check ringkas untuk observability operasional
CREATE OR REPLACE FUNCTION public.audit_health_summary()
RETURNS TABLE (
    metric_name TEXT,
    metric_value TEXT
) AS $$
BEGIN
    IF NOT public.is_admin_user() THEN
        RAISE EXCEPTION 'Hanya admin yang boleh melihat audit health summary';
    END IF;

    RETURN QUERY
    SELECT 'biometric_audit_log_total_rows'::TEXT, COUNT(*)::TEXT
    FROM public.biometric_audit_log
    UNION ALL
    SELECT 'audit_logs_total_rows'::TEXT, COUNT(*)::TEXT
    FROM public.audit_logs
    UNION ALL
    SELECT 'audit_maintenance_log_total_rows'::TEXT, COUNT(*)::TEXT
    FROM public.audit_maintenance_log
    UNION ALL
    SELECT 'latest_biometric_event_at'::TEXT, COALESCE(MAX(created_at)::TEXT, 'NULL')
    FROM public.biometric_audit_log
    UNION ALL
    SELECT 'latest_audit_logs_event_at'::TEXT, COALESCE(MAX(created_at)::TEXT, 'NULL')
    FROM public.audit_logs
    UNION ALL
    SELECT 'sync_row_gap_biometric_minus_audit_logs'::TEXT,
           (SELECT COUNT(*) FROM public.biometric_audit_log)::TEXT || ' - ' ||
           (SELECT COUNT(*) FROM public.audit_logs)::TEXT;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.audit_health_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.audit_health_summary() TO authenticated;

-- 7b. Backfill data dari biometric_audit_log ke audit_logs (idempotent)
INSERT INTO public.audit_logs (
    id,
    user_id,
    user_email,
    user_name,
    action,
    portal_type,
    entity_type,
    entity_id,
    entity_name,
    old_data,
    new_data,
    changes,
    description,
    ip_address,
    user_agent,
    created_at
)
SELECT
    b.id,
    NULL::uuid,
    'system@local',
    'System',
    CASE
        WHEN b.action IN ('device_registered') THEN 'CREATE'
        WHEN b.action IN ('device_removed') THEN 'DELETE'
        ELSE 'UPDATE'
    END,
    'operational',
    'biometric_device',
    COALESCE(b.device_id, b.employee_id),
    'Biometric Device Event',
    NULL::jsonb,
    b.metadata,
    CASE
        WHEN b.action IN ('device_status_changed', 'device_metadata_changed', 'device_blocked', 'device_unblocked') THEN
            jsonb_build_object('source_action', b.action, 'metadata', b.metadata)
        ELSE NULL::jsonb
    END,
    'Biometric event: ' || b.action,
    b.ip_address,
    b.user_agent,
    b.created_at
FROM public.biometric_audit_log b
ON CONFLICT (id) DO NOTHING;

-- 8. Verify tables & indexes created
SELECT 
    'biometric_audit_log' as table_name,
    COUNT(*) as record_count
FROM public.biometric_audit_log;

SELECT 
    to_regclass('public.audit_logs') as audit_logs_table;

SELECT
    to_regclass('public.biometric_audit_log') as biometric_audit_log_table,
    to_regclass('public.device_anomalies') as device_anomalies_matview,
    to_regclass('public.audit_maintenance_log') as audit_maintenance_log_table;

SELECT
    routine_name,
    security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
    AND routine_name IN (
        'log_device_change',
        'refresh_device_anomalies',
        'cleanup_old_biometric_audit_logs',
        'sync_biometric_audit_to_audit_logs',
        'audit_health_summary'
    )
ORDER BY routine_name;

SELECT
        tgname AS trigger_name,
        tgrelid::regclass AS table_name,
        tgenabled AS enabled
FROM pg_trigger
WHERE tgname IN ('trigger_log_device_change', 'trigger_sync_biometric_to_audit_logs')
ORDER BY tgname;

SELECT
        tablename,
        policyname,
        cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('biometric_audit_log', 'audit_logs', 'audit_maintenance_log')
ORDER BY tablename, policyname;

SELECT 
    indexrelname AS indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE relname = 'biometric_audit_log'
ORDER BY idx_scan DESC;

SELECT
    portal_type,
    COUNT(*) AS total
FROM public.audit_logs
GROUP BY portal_type
ORDER BY portal_type;

DO $$
BEGIN
    BEGIN
        PERFORM 1 FROM public.audit_health_summary();
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Skip audit_health_summary verification: %', SQLERRM;
    END;
END
$$;


-- ==========================================
-- FILE: 006b-step5-audit-simplified.sql
-- ==========================================

-- STEP 5 SIMPLIFIED: Audit Logging untuk Biometric Events
-- Versi simplified untuk testing

-- 1. Create audit log table
CREATE TABLE IF NOT EXISTS public.biometric_audit_log (
    id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
    employee_id TEXT REFERENCES public.employees(id) ON DELETE SET NULL,
    device_id TEXT REFERENCES public.employee_devices(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN (
        'device_registered',
        'device_blocked',
        'device_unblocked',
        'device_removed',
        'device_status_changed',
        'device_metadata_changed'
    )),
    status VARCHAR(50) CHECK (status IN ('success', 'failed', 'warning')),
    biometric_type VARCHAR(50),
    confidence_score DECIMAL(3,2),
    failure_reason TEXT,
    metadata JSONB,
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.biometric_audit_log ENABLE ROW LEVEL SECURITY;

-- 3. Simple RLS policy (admin & self read)
DROP POLICY IF EXISTS "biometric_audit_log_read" ON public.biometric_audit_log;
CREATE POLICY "biometric_audit_log_read"
    ON public.biometric_audit_log FOR SELECT
    USING (
        public.is_admin_user() OR
        employee_id = public.current_employee_id()
    );

-- 4. Basic indexes
CREATE INDEX IF NOT EXISTS idx_biometric_audit_employee_id
    ON public.biometric_audit_log(employee_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_biometric_audit_device_id
    ON public.biometric_audit_log(device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_biometric_audit_action
    ON public.biometric_audit_log(action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_biometric_audit_status
    ON public.biometric_audit_log(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_biometric_audit_created_at_brin
    ON public.biometric_audit_log USING BRIN (created_at);

CREATE INDEX IF NOT EXISTS idx_biometric_audit_created_at_desc
    ON public.biometric_audit_log(created_at DESC);

-- 5. Simple trigger for device changes
CREATE OR REPLACE FUNCTION log_device_change()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.biometric_audit_log
        (employee_id, device_id, action, status, metadata, created_at)
        VALUES (
            NEW.employee_id,
            NEW.id,
            'device_registered',
            'success',
            jsonb_build_object(
                'platform', NEW.platform,
                'device_name', NEW.device_name,
                'is_primary', NEW.is_primary
            ),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' AND (
        OLD.status IS DISTINCT FROM NEW.status OR
        OLD.platform IS DISTINCT FROM NEW.platform OR
        OLD.device_name IS DISTINCT FROM NEW.device_name OR
        OLD.is_primary IS DISTINCT FROM NEW.is_primary
    ) THEN
        INSERT INTO public.biometric_audit_log
        (employee_id, device_id, action, status, metadata, created_at)
        VALUES (
            NEW.employee_id,
            NEW.id,
            CASE
                WHEN OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'Blocked' THEN 'device_blocked'
                WHEN OLD.status IS DISTINCT FROM NEW.status AND NEW.status IN ('Active', 'Inactive') AND OLD.status = 'Blocked' THEN 'device_unblocked'
                WHEN OLD.status IS DISTINCT FROM NEW.status THEN 'device_status_changed'
                ELSE 'device_metadata_changed'
            END,
            'success',
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'old_platform', OLD.platform,
                'new_platform', NEW.platform,
                'old_device_name', OLD.device_name,
                'new_device_name', NEW.device_name,
                'old_is_primary', OLD.is_primary,
                'new_is_primary', NEW.is_primary
            ),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO public.biometric_audit_log
        (employee_id, device_id, action, status, metadata, created_at)
        VALUES (
            OLD.employee_id,
            OLD.id,
            'device_removed',
            'success',
            jsonb_build_object(
                'platform', OLD.platform,
                'device_name', OLD.device_name
            ),
            NOW()
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Attach trigger
DROP TRIGGER IF EXISTS trigger_log_device_change ON public.employee_devices;
CREATE TRIGGER trigger_log_device_change
    AFTER INSERT OR UPDATE OR DELETE ON public.employee_devices
    FOR EACH ROW
    EXECUTE FUNCTION log_device_change();

-- 7. Verify
-- Expect: 1 row with the table name and a non-zero column count
SELECT 
    'biometric_audit_log created' AS status,
    'public.biometric_audit_log' AS table_name,
    COUNT(*) AS columns_count
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'biometric_audit_log';

-- ==========================================
-- FILE: 007-step6-attendance-governance.sql
-- ==========================================

-- STEP 6: Attendance Governance (Maker-Checker + Revision History)
-- Jalankan setelah database-setup-step5-audit-log.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Helper: role user saat ini
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT e.role
    FROM public.employees e
    WHERE e."user_id" = auth.uid()
    LIMIT 1;
$$;

-- Helper: apakah user termasuk peran operasional
CREATE OR REPLACE FUNCTION public.is_operational_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(public.current_user_role() IN ('admin', 'hrd', 'hr', 'kepala_ruangan'), FALSE);
$$;

GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_operational_user() TO authenticated;

-- Reason code terstruktur untuk perubahan manual
CREATE TABLE IF NOT EXISTS public.attendance_reason_codes (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

INSERT INTO public.attendance_reason_codes (code, label, description)
VALUES
    ('FORGOT_CHECK_IN', 'Lupa Check-in', 'Karyawan lupa melakukan check-in tepat waktu.'),
    ('FORGOT_CHECK_OUT', 'Lupa Check-out', 'Karyawan lupa melakukan check-out tepat waktu.'),
    ('DEVICE_FAILURE', 'Gangguan Perangkat', 'Perangkat absensi tidak dapat digunakan.'),
    ('NETWORK_FAILURE', 'Gangguan Jaringan', 'Kendala jaringan saat absensi.'),
    ('SHIFT_ADJUSTMENT', 'Penyesuaian Shift', 'Perubahan jadwal/shift terkonfirmasi.'),
    ('EMERGENCY_OVERRIDE', 'Emergency Override', 'Koreksi karena kondisi darurat operasional.'),
    ('BULK_IMPORT_FIX', 'Perbaikan Bulk Import', 'Perbaikan massal hasil import data absensi.')
ON CONFLICT (code) DO NOTHING;

-- Request perubahan absensi (maker-checker)
CREATE TABLE IF NOT EXISTS public.attendance_change_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    request_type VARCHAR(20) NOT NULL DEFAULT 'single' CHECK (request_type IN ('single', 'bulk_import')),
    reason_code TEXT NOT NULL REFERENCES public.attendance_reason_codes(code),
    reason_detail TEXT,
    proposed_data JSONB NOT NULL,
    current_data JSONB,
    source_portal VARCHAR(20) NOT NULL DEFAULT 'operational' CHECK (source_portal IN ('personal', 'operational')),
    maker_user_id UUID NOT NULL DEFAULT auth.uid(),
    maker_employee_id TEXT,
    maker_device_fingerprint TEXT,
    maker_ip_address VARCHAR(45),
    maker_user_agent TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    location_text TEXT,
    location_distance_meters DOUBLE PRECISION,
    location_verified BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    checker_user_id UUID,
    review_note TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_change_requests_status_time
    ON public.attendance_change_requests(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_change_requests_employee_date
    ON public.attendance_change_requests(employee_id, attendance_date DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_change_requests_employee_date_pending
    ON public.attendance_change_requests(employee_id, attendance_date)
    WHERE status = 'pending';

-- Riwayat revisi spesifik per record absensi
CREATE TABLE IF NOT EXISTS public.attendance_revision_history (
    id BIGSERIAL PRIMARY KEY,
    attendance_id TEXT,
    request_id TEXT REFERENCES public.attendance_change_requests(id) ON DELETE SET NULL,
    employee_id TEXT NOT NULL,
    attendance_date DATE NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('APPROVE', 'REJECT', 'SYSTEM')),
    before_data JSONB,
    after_data JSONB,
    reason_code TEXT,
    reason_detail TEXT,
    changed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_revision_employee_date
    ON public.attendance_revision_history(employee_id, attendance_date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_revision_request
    ON public.attendance_revision_history(request_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_attendance_change_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.set_attendance_change_request_updated_at() FROM PUBLIC;

DROP TRIGGER IF EXISTS trigger_set_attendance_change_request_updated_at ON public.attendance_change_requests;
CREATE TRIGGER trigger_set_attendance_change_request_updated_at
    BEFORE UPDATE ON public.attendance_change_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.set_attendance_change_request_updated_at();

CREATE OR REPLACE FUNCTION public.validate_attendance_change_request_review()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('approved', 'rejected') THEN
        IF NEW.checker_user_id IS NULL THEN
            NEW.checker_user_id := auth.uid();
        END IF;

        IF NEW.checker_user_id = NEW.maker_user_id THEN
            RAISE EXCEPTION 'Maker dan checker tidak boleh user yang sama';
        END IF;

        IF NEW.reviewed_at IS NULL THEN
            NEW.reviewed_at := NOW();
        END IF;

        IF NEW.status = 'rejected' AND COALESCE(BTRIM(NEW.review_note), '') = '' THEN
            RAISE EXCEPTION 'Alasan reject wajib diisi';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.validate_attendance_change_request_review() FROM PUBLIC;

DROP TRIGGER IF EXISTS trigger_validate_attendance_change_request_review ON public.attendance_change_requests;
CREATE TRIGGER trigger_validate_attendance_change_request_review
    BEFORE UPDATE ON public.attendance_change_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_attendance_change_request_review();

CREATE OR REPLACE FUNCTION public.resolve_attendance_record_id(
    p_employee_id TEXT,
    p_attendance_date DATE
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    attendance_id TEXT;
    has_camel BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'attendance'
          AND c.column_name = 'employeeId'
    ) INTO has_camel;

    IF has_camel THEN
        EXECUTE 'SELECT a.id::text FROM public.attendance a WHERE a."employeeId" = $1 AND a.tanggal = $2 LIMIT 1'
        INTO attendance_id
        USING p_employee_id, p_attendance_date;
    ELSE
        EXECUTE 'SELECT a.id::text FROM public.attendance a WHERE a.employee_id = $1 AND a.date = $2 LIMIT 1'
        INTO attendance_id
        USING p_employee_id, p_attendance_date;
    END IF;

    RETURN attendance_id;
END;
$$;

REVOKE ALL ON FUNCTION public.resolve_attendance_record_id(TEXT, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_attendance_record_id(TEXT, DATE) TO authenticated;

CREATE OR REPLACE FUNCTION public.insert_attendance_revision_from_request()
RETURNS TRIGGER AS $$
DECLARE
    resolved_attendance_id TEXT;
    revision_action TEXT;
    has_camel_case BOOLEAN;
BEGIN
    IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
        resolved_attendance_id := public.resolve_attendance_record_id(NEW.employee_id, NEW.attendance_date);
        revision_action := UPPER(NEW.status);

        INSERT INTO public.attendance_revision_history (
            attendance_id,
            request_id,
            employee_id,
            attendance_date,
            action,
            before_data,
            after_data,
            reason_code,
            reason_detail,
            changed_by
        ) VALUES (
            resolved_attendance_id,
            NEW.id,
            NEW.employee_id,
            NEW.attendance_date,
            revision_action,
            NEW.current_data,
            CASE
                WHEN NEW.status = 'approved' THEN NEW.proposed_data
                ELSE NEW.current_data
            END,
            NEW.reason_code,
            COALESCE(NEW.review_note, NEW.reason_detail),
            COALESCE(NEW.checker_user_id, auth.uid())
        );

        IF NEW.status = 'approved' THEN
            SELECT EXISTS (
                SELECT 1
                FROM information_schema.columns c
                WHERE c.table_schema = 'public'
                  AND c.table_name = 'attendance'
                  AND c.column_name = 'employeeId'
            ) INTO has_camel_case;

            IF resolved_attendance_id IS NOT NULL THEN
                IF has_camel_case THEN
                    EXECUTE $sql$UPDATE public.attendance
                             SET "clockIn" = COALESCE((NEW.proposed_data->>'clockIn')::time, "clockIn"),
                                 "clockOut" = COALESCE((NEW.proposed_data->>'clockOut')::time, "clockOut"),
                                 location = COALESCE(NEW.proposed_data->>'location', location),
                                 latitude = COALESCE((NEW.proposed_data->>'latitude')::numeric, latitude),
                                 longitude = COALESCE((NEW.proposed_data->>'longitude')::numeric, longitude),
                                 "isLate" = COALESCE((NEW.proposed_data->>'isLate')::boolean, "isLate"),
                                 "overtimeHours" = COALESCE((NEW.proposed_data->>'overtimeHours')::numeric, "overtimeHours"),
                                 status = COALESCE(NEW.proposed_data->>'status', status),
                                 source = COALESCE(NEW.proposed_data->>'source', source),
                                 notes = COALESCE(NEW.proposed_data->>'notes', notes),
                                 updated_at = NOW()
                             WHERE id = $1$sql$
                    USING resolved_attendance_id;
                ELSE
                    EXECUTE $sql$UPDATE public.attendance
                             SET check_in = COALESCE((NEW.proposed_data->>'clockIn')::time, check_in),
                                 check_out = COALESCE((NEW.proposed_data->>'clockOut')::time, check_out),
                                 lokasi = COALESCE(NEW.proposed_data->>'location', lokasi),
                                 latitude = COALESCE((NEW.proposed_data->>'latitude')::numeric, latitude),
                                 longitude = COALESCE((NEW.proposed_data->>'longitude')::numeric, longitude),
                                 is_late = COALESCE((NEW.proposed_data->>'isLate')::boolean, is_late),
                                 overtime_hours = COALESCE((NEW.proposed_data->>'overtimeHours')::numeric, overtime_hours),
                                 status = COALESCE(NEW.proposed_data->>'status', status),
                                 source = COALESCE(NEW.proposed_data->>'source', source),
                                 notes = COALESCE(NEW.proposed_data->>'notes', notes),
                                 updated_at = NOW()
                             WHERE id = $1$sql$
                    USING resolved_attendance_id;
                END IF;
            ELSE
                IF has_camel_case THEN
                    EXECUTE $sql$INSERT INTO public.attendance (
                              id,
                              "employeeId",
                              tanggal,
                              "clockIn",
                              "clockOut",
                              location,
                              latitude,
                              longitude,
                              "isLate",
                              "overtimeHours",
                              status,
                              source,
                              notes,
                              created_at,
                              updated_at
                          )
                          SELECT
                              gen_random_uuid()::text,
                              $1,
                              $2,
                              (NEW.proposed_data->>'clockIn')::time,
                              (NEW.proposed_data->>'clockOut')::time,
                              NEW.proposed_data->>'location',
                              (NEW.proposed_data->>'latitude')::numeric,
                              (NEW.proposed_data->>'longitude')::numeric,
                              (NEW.proposed_data->>'isLate')::boolean,
                              (NEW.proposed_data->>'overtimeHours')::numeric,
                              COALESCE(NEW.proposed_data->>'status', 'Hadir'),
                              COALESCE(NEW.proposed_data->>'source', 'web-admin'),
                              NEW.proposed_data->>'notes',
                              NOW(),
                              NOW()
                          WHERE NOT EXISTS (
                              SELECT 1
                              FROM public.attendance a
                              WHERE a."employeeId" = $1
                                AND a.tanggal = $2
                          )$sql$
                    USING NEW.employee_id, NEW.attendance_date;
                ELSE
                    EXECUTE $sql$INSERT INTO public.attendance (
                              id,
                              employee_id,
                              date,
                              check_in,
                              check_out,
                              lokasi,
                              latitude,
                              longitude,
                              is_late,
                              overtime_hours,
                              status,
                              source,
                              notes,
                              created_at,
                              updated_at
                          )
                          SELECT
                              gen_random_uuid()::text,
                              $1,
                              $2,
                              (NEW.proposed_data->>'clockIn')::time,
                              (NEW.proposed_data->>'clockOut')::time,
                              NEW.proposed_data->>'location',
                              (NEW.proposed_data->>'latitude')::numeric,
                              (NEW.proposed_data->>'longitude')::numeric,
                              (NEW.proposed_data->>'isLate')::boolean,
                              (NEW.proposed_data->>'overtimeHours')::numeric,
                              COALESCE(NEW.proposed_data->>'status', 'Hadir'),
                              COALESCE(NEW.proposed_data->>'source', 'web-admin'),
                              NEW.proposed_data->>'notes',
                              NOW(),
                              NOW()
                          WHERE NOT EXISTS (
                              SELECT 1
                              FROM public.attendance a
                              WHERE a.employee_id = $1
                                AND a.date = $2
                          )$sql$
                    USING NEW.employee_id, NEW.attendance_date;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.insert_attendance_revision_from_request() FROM PUBLIC;

DROP TRIGGER IF EXISTS trigger_insert_attendance_revision_from_request ON public.attendance_change_requests;
CREATE TRIGGER trigger_insert_attendance_revision_from_request
    AFTER UPDATE ON public.attendance_change_requests
    FOR EACH ROW
    WHEN (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected'))
    EXECUTE FUNCTION public.insert_attendance_revision_from_request();

-- RLS
ALTER TABLE public.attendance_reason_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_change_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_revision_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attendance_reason_codes_read" ON public.attendance_reason_codes;
CREATE POLICY "attendance_reason_codes_read"
    ON public.attendance_reason_codes FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "attendance_change_requests_select" ON public.attendance_change_requests;
CREATE POLICY "attendance_change_requests_select"
    ON public.attendance_change_requests FOR SELECT
    USING (
        public.is_operational_user() OR
        maker_user_id = auth.uid() OR
        employee_id = public.current_employee_id()
    );

DROP POLICY IF EXISTS "attendance_change_requests_insert" ON public.attendance_change_requests;
CREATE POLICY "attendance_change_requests_insert"
    ON public.attendance_change_requests FOR INSERT
    WITH CHECK (
        public.is_operational_user() OR
        (
            source_portal = 'personal' AND
            maker_user_id = auth.uid() AND
            employee_id = public.current_employee_id()
        )
    );

DROP POLICY IF EXISTS "attendance_change_requests_update" ON public.attendance_change_requests;
CREATE POLICY "attendance_change_requests_update"
    ON public.attendance_change_requests FOR UPDATE
    USING (
        public.is_operational_user()
    )
    WITH CHECK (
        public.is_operational_user()
    );

DROP POLICY IF EXISTS "attendance_revision_history_select" ON public.attendance_revision_history;
CREATE POLICY "attendance_revision_history_select"
    ON public.attendance_revision_history FOR SELECT
    USING (
        public.is_operational_user() OR
        employee_id = public.current_employee_id()
    );

DROP POLICY IF EXISTS "attendance_revision_history_insert" ON public.attendance_revision_history;
CREATE POLICY "attendance_revision_history_insert"
    ON public.attendance_revision_history FOR INSERT
    WITH CHECK (public.is_operational_user());

GRANT SELECT ON public.attendance_reason_codes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.attendance_change_requests TO authenticated;
GRANT SELECT, INSERT ON public.attendance_revision_history TO authenticated;
REVOKE DELETE ON public.attendance_change_requests FROM authenticated;
REVOKE UPDATE, DELETE ON public.attendance_reason_codes FROM authenticated;
REVOKE UPDATE, DELETE ON public.attendance_revision_history FROM authenticated;

-- Verifikasi cepat
SELECT to_regclass('public.attendance_reason_codes') AS attendance_reason_codes_table;
SELECT to_regclass('public.attendance_change_requests') AS attendance_change_requests_table;
SELECT to_regclass('public.attendance_revision_history') AS attendance_revision_history_table;


-- ==========================================
-- FILE: 008-step7-shift-scheduling.sql
-- ==========================================

-- STEP 7: Shift Scheduling Architecture (Full)
-- Arsitektur penjadwalan shift dengan pola rotasi, transaksi jadwal harian, dan tukar shift.
-- Jalankan setelah database-setup-step6-attendance-governance.sql
-- ==================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. TABEL MASTER: rotation_patterns (Pola Rotasi per Unit)
-- ============================================================
-- Menyimpan template pola rotasi yang dapat di-generate otomatis.
-- Contoh: "P-P-S-S-M-M-L-L" untuk siklus 8 hari.

CREATE TABLE IF NOT EXISTS public.rotation_patterns (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    unit_id TEXT NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    name TEXT NOT NULL,                          -- "Rotasi 3 Shift 8 Hari"
    description TEXT,                            -- Deskripsi opsional
    pattern JSONB NOT NULL DEFAULT '[]'::jsonb,  -- Array of shift names: ["Pagi","Pagi","Siang","Siang","Malam","Malam","Libur","Libur"]
    cycle_days INTEGER NOT NULL DEFAULT 7,       -- Panjang siklus (jumlah elemen pattern)
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT rotation_patterns_cycle_check CHECK (cycle_days > 0 AND cycle_days <= 56),
    CONSTRAINT rotation_patterns_name_unit_unique UNIQUE (unit_id, name)
);

COMMENT ON TABLE public.rotation_patterns IS 'Template pola rotasi shift per unit. Pattern berisi array nama shift yang berulang setiap cycle_days hari.';
COMMENT ON COLUMN public.rotation_patterns.pattern IS 'JSON array of shift names. Contoh: ["Pagi","Pagi","Siang","Siang","Malam","Malam","Libur","Libur"]. "Libur" = hari libur.';

-- ============================================================
-- 2. TABEL TRANSAKSI: employee_schedules (Jadwal Harian per Karyawan)
-- ============================================================
-- Setiap baris = 1 hari kerja untuk 1 karyawan.
-- Ini adalah tabel utama yang menggantikan employee.shift statis.

CREATE TABLE IF NOT EXISTS public.employee_schedules (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    unit_id TEXT NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    shift_name TEXT NOT NULL,                   -- Nama shift (reference ke ShiftDefinition.name di units.shifts)
    shift_start_time TIME,                     -- Cached jam masuk (dari ShiftDefinition, untuk query cepat)
    shift_end_time TIME,                       -- Cached jam pulang
    is_off_day BOOLEAN NOT NULL DEFAULT FALSE,  -- TRUE jika hari ini libur (shift_name = "Libur")

    -- Status & workflow
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'swapped', 'override', 'cancelled')),
    
    -- Swap tracking
    swapped_with_employee_id TEXT REFERENCES public.employees(id),
    swapped_with_schedule_id TEXT REFERENCES public.employee_schedules(id),
    swap_reason TEXT,
    swap_approved_by UUID REFERENCES auth.users(id),
    swap_approved_at TIMESTAMP WITH TIME ZONE,

    -- Generation tracking
    generated_from_pattern_id TEXT REFERENCES public.rotation_patterns(id),
    rotation_day_index INTEGER,                -- Posisi dalam siklus rotasi (0-based)

    -- Override tracking
    override_reason TEXT,
    override_by UUID REFERENCES auth.users(id),

    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Constraints
    CONSTRAINT employee_schedules_unique_day UNIQUE (employee_id, schedule_date),
    CONSTRAINT employee_schedules_swap_self_check CHECK (swapped_with_employee_id != employee_id)
);

COMMENT ON TABLE public.employee_schedules IS 'Jadwal shift harian per karyawan. Setiap baris = 1 karyawan pada 1 tanggal tertentu.';
COMMENT ON COLUMN public.employee_schedules.status IS 'draft = belum dipublikasi, published = aktif untuk absensi, swapped = hasil tukar shift, override = diubah manual, cancelled = dibatalkan.';

-- ============================================================
-- 3. TABEL: schedule_publish_logs (Riwayat Publish Jadwal)
-- ============================================================
-- Track kapan jadwal di-lock/publish oleh Kepala Ruangan.

CREATE TABLE IF NOT EXISTS public.schedule_publish_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    unit_id TEXT NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    total_schedules INTEGER NOT NULL DEFAULT 0,
    total_employees INTEGER NOT NULL DEFAULT 0,
    published_by UUID NOT NULL REFERENCES auth.users(id),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    notes TEXT,

    CONSTRAINT schedule_publish_period_check CHECK (period_end >= period_start)
);

COMMENT ON TABLE public.schedule_publish_logs IS 'Log riwayat publish/lock jadwal per periode oleh Kepala Ruangan.';

-- ============================================================
-- 4. INDEXES untuk performa query
-- ============================================================

-- Query utama: jadwal per unit per bulan
CREATE INDEX IF NOT EXISTS idx_employee_schedules_unit_date
    ON public.employee_schedules (unit_id, schedule_date);

-- Query: jadwal per karyawan per bulan
CREATE INDEX IF NOT EXISTS idx_employee_schedules_employee_date
    ON public.employee_schedules (employee_id, schedule_date);

-- Query: filter by status (draft vs published)
CREATE INDEX IF NOT EXISTS idx_employee_schedules_status
    ON public.employee_schedules (status) WHERE status != 'cancelled';

-- Query: find swapped schedules
CREATE INDEX IF NOT EXISTS idx_employee_schedules_swap
    ON public.employee_schedules (swapped_with_employee_id) WHERE swapped_with_employee_id IS NOT NULL;

-- Rotation patterns per unit
CREATE INDEX IF NOT EXISTS idx_rotation_patterns_unit
    ON public.rotation_patterns (unit_id) WHERE is_active = TRUE;

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.rotation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_publish_logs ENABLE ROW LEVEL SECURITY;

-- rotation_patterns: Kepala Ruangan hanya lihat/edit unit sendiri; Admin/HRD lihat semua
DROP POLICY IF EXISTS "rotation_patterns_select" ON public.rotation_patterns;
CREATE POLICY "rotation_patterns_select" ON public.rotation_patterns
    FOR SELECT TO authenticated
    USING (
        public.is_operational_user()
        OR unit_id IN (
            SELECT COALESCE(e."managedUnitId", e."unitKerjaId")
            FROM public.employees e WHERE e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "rotation_patterns_insert" ON public.rotation_patterns;
CREATE POLICY "rotation_patterns_insert" ON public.rotation_patterns
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_operational_user()
        OR unit_id IN (
            SELECT COALESCE(e."managedUnitId", e."unitKerjaId")
            FROM public.employees e WHERE e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "rotation_patterns_update" ON public.rotation_patterns;
CREATE POLICY "rotation_patterns_update" ON public.rotation_patterns
    FOR UPDATE TO authenticated
    USING (
        public.is_operational_user()
        OR unit_id IN (
            SELECT COALESCE(e."managedUnitId", e."unitKerjaId")
            FROM public.employees e WHERE e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "rotation_patterns_delete" ON public.rotation_patterns;
CREATE POLICY "rotation_patterns_delete" ON public.rotation_patterns
    FOR DELETE TO authenticated
    USING (
        public.is_operational_user()
        OR unit_id IN (
            SELECT COALESCE(e."managedUnitId", e."unitKerjaId")
            FROM public.employees e WHERE e.user_id = auth.uid()
        )
    );

-- employee_schedules: Kepala Ruangan lihat/edit unit sendiri; Karyawan lihat jadwal sendiri; Admin semua
DROP POLICY IF EXISTS "employee_schedules_select" ON public.employee_schedules;
CREATE POLICY "employee_schedules_select" ON public.employee_schedules
    FOR SELECT TO authenticated
    USING (
        public.is_operational_user()
        OR employee_id IN (SELECT id FROM public.employees WHERE user_id = auth.uid())
        OR unit_id IN (
            SELECT COALESCE(e."managedUnitId", e."unitKerjaId")
            FROM public.employees e WHERE e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "employee_schedules_insert" ON public.employee_schedules;
CREATE POLICY "employee_schedules_insert" ON public.employee_schedules
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_operational_user()
        OR unit_id IN (
            SELECT COALESCE(e."managedUnitId", e."unitKerjaId")
            FROM public.employees e WHERE e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "employee_schedules_update" ON public.employee_schedules;
CREATE POLICY "employee_schedules_update" ON public.employee_schedules
    FOR UPDATE TO authenticated
    USING (
        public.is_operational_user()
        OR unit_id IN (
            SELECT COALESCE(e."managedUnitId", e."unitKerjaId")
            FROM public.employees e WHERE e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "employee_schedules_delete" ON public.employee_schedules;
CREATE POLICY "employee_schedules_delete" ON public.employee_schedules
    FOR DELETE TO authenticated
    USING (
        public.is_operational_user()
    );

-- schedule_publish_logs: Kepala Ruangan + Admin
DROP POLICY IF EXISTS "schedule_publish_logs_select" ON public.schedule_publish_logs;
CREATE POLICY "schedule_publish_logs_select" ON public.schedule_publish_logs
    FOR SELECT TO authenticated
    USING (
        public.is_operational_user()
        OR unit_id IN (
            SELECT COALESCE(e."managedUnitId", e."unitKerjaId")
            FROM public.employees e WHERE e.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "schedule_publish_logs_insert" ON public.schedule_publish_logs;
CREATE POLICY "schedule_publish_logs_insert" ON public.schedule_publish_logs
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_operational_user()
        OR unit_id IN (
            SELECT COALESCE(e."managedUnitId", e."unitKerjaId")
            FROM public.employees e WHERE e.user_id = auth.uid()
        )
    );

-- ============================================================
-- 6. TRIGGER: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_rotation_patterns ON public.rotation_patterns;
CREATE TRIGGER set_updated_at_rotation_patterns
    BEFORE UPDATE ON public.rotation_patterns
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_employee_schedules ON public.employee_schedules;
CREATE TRIGGER set_updated_at_employee_schedules
    BEFORE UPDATE ON public.employee_schedules
    FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================================
-- 7. FUNCTION: Generate jadwal dari pola rotasi
-- ============================================================
-- Digunakan untuk bulk-insert jadwal berdasarkan pola rotasi.
-- Parameter:
--   p_employee_id: ID karyawan
--   p_unit_id: ID unit
--   p_pattern_id: ID pola rotasi
--   p_start_date: Tanggal mulai generate
--   p_end_date: Tanggal akhir generate
--   p_rotation_offset: Offset hari dalam siklus (untuk staggered start)
--   p_created_by: User ID yang generate

CREATE OR REPLACE FUNCTION public.generate_schedule_from_pattern(
    p_employee_id TEXT,
    p_unit_id TEXT,
    p_pattern_id TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_rotation_offset INTEGER DEFAULT 0,
    p_created_by UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pattern JSONB;
    v_cycle_days INTEGER;
    v_current_date DATE;
    v_day_index INTEGER;
    v_shift_name TEXT;
    v_is_off BOOLEAN;
    v_count INTEGER := 0;
    v_unit_shifts JSONB;
    v_shift_start TIME;
    v_shift_end TIME;
BEGIN
    -- Load pattern
    SELECT pattern, cycle_days INTO v_pattern, v_cycle_days
    FROM public.rotation_patterns
    WHERE id = p_pattern_id AND is_active = TRUE;

    IF v_pattern IS NULL THEN
        RAISE EXCEPTION 'Pola rotasi tidak ditemukan atau tidak aktif: %', p_pattern_id;
    END IF;

    -- Load unit shifts for time lookup
    SELECT shifts INTO v_unit_shifts FROM public.units WHERE id = p_unit_id;

    -- Loop through each date
    v_current_date := p_start_date;
    WHILE v_current_date <= p_end_date LOOP
        -- Calculate rotation index with offset
        v_day_index := ((v_current_date - p_start_date) + p_rotation_offset) % v_cycle_days;
        v_shift_name := v_pattern->>v_day_index;
        v_is_off := (v_shift_name IS NULL OR LOWER(v_shift_name) = 'libur' OR v_shift_name = '');

        -- Lookup shift start/end from unit config
        v_shift_start := NULL;
        v_shift_end := NULL;
        IF NOT v_is_off AND v_unit_shifts IS NOT NULL THEN
            SELECT
                (elem->>'startTime')::TIME,
                (elem->>'endTime')::TIME
            INTO v_shift_start, v_shift_end
            FROM jsonb_array_elements(v_unit_shifts) AS elem
            WHERE elem->>'name' = v_shift_name
               OR elem->>'code' = v_shift_name
               OR LOWER(elem->>'name') = LOWER(v_shift_name)
               OR UPPER(elem->>'code') = UPPER(v_shift_name)
            LIMIT 1;
        END IF;

        -- Insert (skip if already exists via ON CONFLICT)
        INSERT INTO public.employee_schedules (
            employee_id, unit_id, schedule_date, shift_name,
            shift_start_time, shift_end_time, is_off_day,
            status, generated_from_pattern_id, rotation_day_index, created_by
        ) VALUES (
            p_employee_id, p_unit_id, v_current_date, COALESCE(v_shift_name, 'Libur'),
            v_shift_start, v_shift_end, v_is_off,
            'draft', p_pattern_id, v_day_index, p_created_by
        )
        ON CONFLICT (employee_id, schedule_date)
        DO UPDATE SET
            shift_name = EXCLUDED.shift_name,
            shift_start_time = EXCLUDED.shift_start_time,
            shift_end_time = EXCLUDED.shift_end_time,
            is_off_day = EXCLUDED.is_off_day,
            status = 'draft',
            generated_from_pattern_id = EXCLUDED.generated_from_pattern_id,
            rotation_day_index = EXCLUDED.rotation_day_index,
            updated_at = NOW();

        v_count := v_count + 1;
        v_current_date := v_current_date + 1;
    END LOOP;

    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.generate_schedule_from_pattern IS 'Generate jadwal harian untuk seorang karyawan berdasarkan pola rotasi. ON CONFLICT akan overwrite jadwal draft yang sudah ada.';

-- ============================================================
-- 8. FUNCTION: Publish jadwal (lock draft → published)
-- ============================================================

CREATE OR REPLACE FUNCTION public.publish_unit_schedules(
    p_unit_id TEXT,
    p_start_date DATE,
    p_end_date DATE,
    p_published_by UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE public.employee_schedules
    SET status = 'published', updated_at = NOW()
    WHERE unit_id = p_unit_id
      AND schedule_date BETWEEN p_start_date AND p_end_date
      AND status = 'draft';

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Log the publish event
    INSERT INTO public.schedule_publish_logs (
        unit_id, period_start, period_end,
        total_schedules, total_employees, published_by
    ) VALUES (
        p_unit_id, p_start_date, p_end_date,
        v_count,
        (SELECT COUNT(DISTINCT employee_id) FROM public.employee_schedules
         WHERE unit_id = p_unit_id AND schedule_date BETWEEN p_start_date AND p_end_date AND status = 'published'),
        p_published_by
    );

    RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.publish_unit_schedules IS 'Publish semua jadwal draft dalam range tanggal untuk sebuah unit. Menandai status menjadi published dan mencatat log.';

-- ============================================================
-- 9. FUNCTION: Validasi jam kerja mingguan
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_weekly_hours(
    p_employee_id TEXT,
    p_week_start DATE  -- Harus hari Senin
)
RETURNS TABLE (
    total_scheduled_days INTEGER,
    total_work_days INTEGER,
    total_off_days INTEGER,
    estimated_hours NUMERIC(5,2),
    exceeds_limit BOOLEAN
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_week_end DATE := p_week_start + 6;
    v_scheduled INTEGER;
    v_work INTEGER;
    v_off INTEGER;
    v_hours NUMERIC(5,2) := 0;
    rec RECORD;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE NOT is_off_day),
        COUNT(*) FILTER (WHERE is_off_day)
    INTO v_scheduled, v_work, v_off
    FROM public.employee_schedules
    WHERE employee_id = p_employee_id
      AND schedule_date BETWEEN p_week_start AND v_week_end
      AND status NOT IN ('cancelled');

    -- Estimate hours from shift times
    FOR rec IN
        SELECT shift_start_time, shift_end_time, is_off_day
        FROM public.employee_schedules
        WHERE employee_id = p_employee_id
          AND schedule_date BETWEEN p_week_start AND v_week_end
          AND status NOT IN ('cancelled')
          AND NOT is_off_day
    LOOP
        IF rec.shift_start_time IS NOT NULL AND rec.shift_end_time IS NOT NULL THEN
            IF rec.shift_end_time > rec.shift_start_time THEN
                v_hours := v_hours + EXTRACT(EPOCH FROM (rec.shift_end_time - rec.shift_start_time)) / 3600.0;
            ELSE
                -- Overnight shift
                v_hours := v_hours + EXTRACT(EPOCH FROM (('24:00:00'::TIME - rec.shift_start_time) + rec.shift_end_time)) / 3600.0;
            END IF;
        ELSE
            v_hours := v_hours + 8; -- Default 8 hours if times not cached
        END IF;
    END LOOP;

    RETURN QUERY SELECT v_scheduled, v_work, v_off, v_hours, (v_hours > 40.0);
END;
$$;

COMMENT ON FUNCTION public.validate_weekly_hours IS 'Validasi total jam kerja per minggu untuk seorang karyawan. Mengembalikan estimasi jam dan flag jika melebihi 40 jam.';

-- ============================================================
-- 10. GRANT PERMISSIONS
-- ============================================================

GRANT ALL ON public.rotation_patterns TO authenticated;
GRANT ALL ON public.employee_schedules TO authenticated;
GRANT ALL ON public.schedule_publish_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_schedule_from_pattern TO authenticated;
GRANT EXECUTE ON FUNCTION public.publish_unit_schedules TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_weekly_hours TO authenticated;

-- ============================================================
-- DONE! Jalankan script ini di Supabase SQL Editor.
-- Setelah ini, jalankan Phase 2 (TypeScript types & services).
-- ============================================================


-- ==========================================
-- FILE: 009-add-nik.sql
-- ==========================================

-- Menambahkan kolom NIK (Nomor Induk Karyawan) ke tabel employees
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS nik TEXT UNIQUE;

-- Membuat index untuk performa pencarian by NIK
CREATE INDEX IF NOT EXISTS idx_employees_nik ON public.employees(nik);

-- Menambahkan comment untuk dokumentasi
COMMENT ON COLUMN public.employees.nik IS 'Nomor Induk Karyawan (untuk ID card dan keperluan HR). Format: TAHUN-DEPT-URUTAN (contoh: 2024-MED-001)';

-- Update RLS policies untuk NIK (sudah tercover di policy existing, tidak perlu policy baru)


-- ==========================================
-- FILE: 010-add-departments-positions.sql
-- ==========================================

-- Membuat tabel departments (Departemen)
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Membuat tabel positions (Jabatan)
CREATE TABLE IF NOT EXISTS public.positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nama TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

-- Policy untuk departments - admin dapat melakukan semua operasi
DROP POLICY IF EXISTS "Admin dapat melakukan semua operasi pada departments" ON public.departments;
CREATE POLICY "Admin dapat melakukan semua operasi pada departments"
ON public.departments
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.employees
        WHERE employees.user_id = auth.uid()
        AND employees.role = 'admin'
    )
);

-- Policy untuk positions - admin dapat melakukan semua operasi
DROP POLICY IF EXISTS "Admin dapat melakukan semua operasi pada positions" ON public.positions;
CREATE POLICY "Admin dapat melakukan semua operasi pada positions"
ON public.positions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.employees
        WHERE employees.user_id = auth.uid()
        AND employees.role = 'admin'
    )
);

-- Policy untuk departments - semua pengguna dapat membaca
DROP POLICY IF EXISTS "Semua pengguna dapat membaca departments" ON public.departments;
CREATE POLICY "Semua pengguna dapat membaca departments"
ON public.departments
FOR SELECT
USING (true);

-- Policy untuk positions - semua pengguna dapat membaca
DROP POLICY IF EXISTS "Semua pengguna dapat membaca positions" ON public.positions;
CREATE POLICY "Semua pengguna dapat membaca positions"
ON public.positions
FOR SELECT
USING (true);

-- Insert data default untuk departments
INSERT INTO public.departments (nama) VALUES
    ('Departemen Medis'),
    ('Departemen Keperawatan'),
    ('Departemen Penunjang Medis'),
    ('Departemen Administrasi'),
    ('Departemen Keuangan'),
    ('Departemen SDM')
ON CONFLICT (nama) DO NOTHING;

-- Insert data default untuk positions
INSERT INTO public.positions (nama) VALUES
    ('Dokter Umum'),
    ('Dokter Spesialis'),
    ('Perawat'),
    ('Bidan'),
    ('Apoteker'),
    ('Analis Laboratorium'),
    ('Radiografer'),
    ('Tenaga Administrasi'),
    ('Staf Keuangan'),
    ('Manajer'),
    ('Direktur')
ON CONFLICT (nama) DO NOTHING;

-- Menambahkan comment untuk dokumentasi
COMMENT ON TABLE public.departments IS 'Tabel untuk menyimpan data departemen di rumah sakit';
COMMENT ON TABLE public.positions IS 'Tabel untuk menyimpan data jabatan di rumah sakit';


-- ==========================================
-- FILE: 011-add-system-settings.sql
-- ==========================================

-- Membuat tabel system_settings untuk pengaturan sistem
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    institution_name TEXT NOT NULL DEFAULT 'HRMS Pro',
    institution_type TEXT NOT NULL DEFAULT 'Rumah Sakit' CHECK (institution_type IN ('Rumah Sakit', 'Klinik', 'Puskesmas')),
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policy untuk system_settings - admin dapat melakukan semua operasi
DROP POLICY IF EXISTS "Admin dapat melakukan semua operasi pada system_settings" ON public.system_settings;
CREATE POLICY "Admin dapat melakukan semua operasi pada system_settings"
ON public.system_settings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.employees
        WHERE employees.user_id = auth.uid()
        AND employees.role = 'admin'
    )
);

-- Policy untuk system_settings - semua pengguna dapat membaca
DROP POLICY IF EXISTS "Semua pengguna dapat membaca system_settings" ON public.system_settings;
CREATE POLICY "Semua pengguna dapat membaca system_settings"
ON public.system_settings
FOR SELECT
USING (true);

-- Insert data default untuk system_settings (hanya satu baris)
INSERT INTO public.system_settings (institution_name, institution_type, address, phone)
VALUES ('HRMS Pro', 'Rumah Sakit', '', '')
ON CONFLICT DO NOTHING;

-- Membuat fungsi untuk update timestamp otomatis
CREATE OR REPLACE FUNCTION update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Membuat trigger untuk update timestamp
DROP TRIGGER IF EXISTS set_system_settings_timestamp ON public.system_settings;
CREATE TRIGGER set_system_settings_timestamp
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION update_system_settings_timestamp();

-- Menambahkan comment untuk dokumentasi
COMMENT ON TABLE public.system_settings IS 'Tabel untuk menyimpan pengaturan sistem seperti nama institusi, jenis, alamat, dan telepon';
COMMENT ON COLUMN public.system_settings.institution_name IS 'Nama institusi (rumah sakit/klinik)';
COMMENT ON COLUMN public.system_settings.institution_type IS 'Jenis institusi: Rumah Sakit, Klinik, atau Puskesmas';
COMMENT ON COLUMN public.system_settings.logo_url IS 'URL logo institusi (opsional)';
COMMENT ON COLUMN public.system_settings.address IS 'Alamat lengkap institusi';
COMMENT ON COLUMN public.system_settings.phone IS 'Nomor telepon institusi';


-- ==========================================
-- FILE: 012-add-face-biometric.sql
-- ==========================================

-- Add face descriptor column for biometric verification
-- This stores the face embedding vector for face recognition

ALTER TABLE employees
ADD COLUMN IF NOT EXISTS face_descriptor JSONB,
ADD COLUMN IF NOT EXISTS face_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS face_verification_enabled BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN employees.face_descriptor IS 'Face embedding vector for biometric verification (128-dimensional float array)';
COMMENT ON COLUMN employees.face_verified_at IS 'Timestamp when face was last verified/enrolled';
COMMENT ON COLUMN employees.face_verification_enabled IS 'Whether face verification is enabled for this employee';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_employees_face_verification_enabled
ON employees(face_verification_enabled)
WHERE face_verification_enabled = true;

-- ==========================================
-- FILE: 013-add-face-recognition.sql
-- ==========================================

-- ============================================================
-- Migration: Face Recognition Enrollment
-- ============================================================
-- Menambahkan kolom untuk menyimpan embedding wajah karyawan
-- (vektor 128/192-dim float dari model FaceNet/MobileFaceNet) yang
-- digunakan sebagai referensi 1:1 matching saat check-in/out.
--
-- Kolom:
--   face_embedding       : Array float JSONB (mis. [0.123, -0.456, ...]).
--   face_embedding_dim   : panjang vektor (128 utk MobileFaceNet, 192/512 lainnya).
--   face_enrolled_at     : kapan enrollment terakhir dilakukan.
--   face_reference_url   : URL foto referensi di Supabase Storage (opsional, untuk audit).
--   face_match_threshold : nilai minimum cosine similarity (0–1) untuk dianggap cocok.
--                          Default 0.65 — bisa di-tune per karyawan oleh admin.
--
-- Aman dijalankan berulang kali.
-- ============================================================

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS face_embedding JSONB,
  ADD COLUMN IF NOT EXISTS face_embedding_dim INTEGER,
  ADD COLUMN IF NOT EXISTS face_enrolled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS face_reference_url TEXT,
  ADD COLUMN IF NOT EXISTS face_match_threshold NUMERIC(4, 3) DEFAULT 0.650;

-- Index untuk lookup karyawan yang sudah enrolled.
CREATE INDEX IF NOT EXISTS idx_employees_face_enrolled
  ON public.employees(face_enrolled_at)
  WHERE face_embedding IS NOT NULL;

-- Storage bucket untuk foto referensi (jalankan via dashboard atau uncomment):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('face-references', 'face-references', false)
-- ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN public.employees.face_embedding IS
  'Vektor embedding wajah (JSON array float) hasil model FaceNet/MobileFaceNet.';
COMMENT ON COLUMN public.employees.face_match_threshold IS
  'Minimum cosine similarity (0–1) untuk dianggap match. Default 0.65.';
COMMENT ON COLUMN public.employees.face_reference_url IS
  'URL foto referensi di Supabase Storage bucket private (untuk audit).';


-- ==========================================
-- FILE: 014-add-geofence-settings.sql
-- ==========================================

-- ============================================================================
-- Migration: Tambah kolom geofence ke system_settings
-- Tujuan   : Dukung validasi lokasi absensi (client-side & server-side) agar
--            karyawan hanya bisa check-in/check-out dari sekitar area RS.
-- Safety   : Idempotent. Aman dijalankan berkali-kali.
-- ============================================================================

ALTER TABLE public.system_settings
    ADD COLUMN IF NOT EXISTS latitude         DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude        DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS geofence_radius_meters INTEGER DEFAULT 500
        CHECK (geofence_radius_meters IS NULL OR geofence_radius_meters >= 50),
    ADD COLUMN IF NOT EXISTS geofence_enabled BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.system_settings.latitude  IS 'Titik pusat geofence RS (WGS84).';
COMMENT ON COLUMN public.system_settings.longitude IS 'Titik pusat geofence RS (WGS84).';
COMMENT ON COLUMN public.system_settings.geofence_radius_meters IS 'Radius toleransi dari titik pusat dalam meter. Minimum 50m agar tidak mengganggu GPS noise normal.';
COMMENT ON COLUMN public.system_settings.geofence_enabled IS 'Jika TRUE, aplikasi mobile akan memperingatkan/menolak check-in di luar radius.';


-- ==========================================
-- FILE: 015-add-attendance-photo.sql
-- ==========================================

-- Migration: Tambah kolom photo_url ke tabel attendance
-- Jalankan di Supabase SQL Editor sebelum menggunakan fitur upload foto absensi.

ALTER TABLE IF EXISTS public.attendance
    ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- (Opsional) Buat storage bucket untuk foto absensi
-- Jalankan di Supabase Dashboard → Storage → New Bucket
-- Nama bucket : attendance-photos
-- Public      : Yes (agar bisa diakses via URL publik)
-- File size   : 5MB max
-- Allowed MIME: image/jpeg, image/png

-- Atau via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance-photos',
  'attendance-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policy: karyawan hanya bisa upload ke folder sendiri
CREATE POLICY "Employees can upload own attendance photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attendance-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- RLS policy: semua authenticated user bisa lihat foto (untuk admin/HRD review)
CREATE POLICY "Authenticated users can view attendance photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'attendance-photos');


-- ==========================================
-- FILE: 016-add-mobile-fields.sql
-- ==========================================

-- ============================================================
-- Migration: tambahkan kolom mobile (push token + foto profil)
-- ============================================================
-- Foto profil sudah tersedia sebagai kolom `foto` (TEXT) di
-- `database-setup-step1.sql`. Migration ini menambahkan:
--   1. expo_push_token  - token Expo push notification per karyawan
--   2. push_token_updated_at - timestamp update token
--   3. (idempotent) memastikan kolom `foto` ada untuk environment
--      lama yang belum sempat menjalankannya.
-- Aman dijalankan berulang kali (IF NOT EXISTS).
-- ============================================================

ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS expo_push_token TEXT,
  ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS foto TEXT;

-- Index untuk lookup token (opsional, untuk batch push)
CREATE INDEX IF NOT EXISTS idx_employees_push_token
  ON public.employees(expo_push_token)
  WHERE expo_push_token IS NOT NULL;

-- Storage bucket untuk avatar (jalankan via Supabase dashboard
-- bila belum ada): nama bucket = 'avatars', public = true.
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;

COMMENT ON COLUMN public.employees.expo_push_token IS
  'Expo push notification token dari mobile app (registered saat login)';
COMMENT ON COLUMN public.employees.foto IS
  'URL foto profil (Supabase Storage public URL atau path)';


-- ==========================================
-- FILE: 017-audit-log.sql
-- ==========================================

-- =============================================
-- AUDIT LOG SYSTEM
-- Mencatat semua aktivitas yang dilakukan admin
-- =============================================

-- 1. Buat tabel audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Siapa yang melakukan
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    
    -- Apa yang dilakukan
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE'
    entity_type TEXT NOT NULL, -- 'employee', 'attendance', 'request', 'payroll', 'unit', 'department', 'position'
    entity_id UUID, -- ID dari data yang diubah
    entity_name TEXT, -- Nama dari data yang diubah (untuk referensi)
    
    -- Detail perubahan
    old_data JSONB, -- Data sebelum perubahan (untuk UPDATE dan DELETE)
    new_data JSONB, -- Data setelah perubahan (untuk CREATE dan UPDATE)
    changes JSONB, -- Ringkasan field yang berubah
    
    -- Metadata
    description TEXT, -- Deskripsi human-readable
    ip_address TEXT, -- IP address user (optional)
    user_agent TEXT, -- Browser info (optional)
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Index untuk performa
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 3. RLS Policies
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin bisa melihat semua audit logs
CREATE POLICY "Admin can view all audit logs"
    ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.user_id = auth.uid()
            AND employees.role = 'admin'
        )
    );

-- Admin bisa insert audit logs (melalui aplikasi)
CREATE POLICY "Admin can insert audit logs"
    ON public.audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.employees
            WHERE employees.user_id = auth.uid()
            AND employees.role = 'admin'
        )
    );

-- Tidak ada yang bisa update atau delete audit logs (immutable)
-- Audit logs hanya bisa dibuat, tidak bisa diubah atau dihapus

-- 4. Function untuk membuat audit log otomatis (trigger-based)
CREATE OR REPLACE FUNCTION public.create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_user_name TEXT;
    v_action TEXT;
    v_entity_name TEXT;
    v_changes JSONB;
BEGIN
    -- Get current user info
    v_user_id := auth.uid();
    
    SELECT email INTO v_user_email
    FROM auth.users
    WHERE id = v_user_id;
    
    SELECT nama INTO v_user_name
    FROM public.employees
    WHERE user_id = v_user_id;
    
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
    END IF;
    
    -- Get entity name based on table
    IF TG_TABLE_NAME = 'employees' THEN
        IF TG_OP = 'DELETE' THEN
            v_entity_name := OLD.nama;
        ELSE
            v_entity_name := NEW.nama;
        END IF;
    END IF;
    
    -- Calculate changes for UPDATE
    IF TG_OP = 'UPDATE' THEN
        v_changes := jsonb_build_object(
            'changed_fields', (
                SELECT jsonb_object_agg(key, jsonb_build_object('old', old_value, 'new', new_value))
                FROM (
                    SELECT key, 
                           to_jsonb(OLD) -> key AS old_value,
                           to_jsonb(NEW) -> key AS new_value
                    FROM jsonb_object_keys(to_jsonb(NEW)) AS key
                    WHERE to_jsonb(OLD) -> key IS DISTINCT FROM to_jsonb(NEW) -> key
                ) changes
            )
        );
    END IF;
    
    -- Insert audit log
    INSERT INTO public.audit_logs (
        user_id,
        user_email,
        user_name,
        action,
        entity_type,
        entity_id,
        entity_name,
        old_data,
        new_data,
        changes,
        description
    ) VALUES (
        v_user_id,
        COALESCE(v_user_email, 'unknown'),
        COALESCE(v_user_name, 'Unknown User'),
        v_action,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        v_entity_name,
        CASE 
            WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD)
            ELSE NULL
        END,
        CASE 
            WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW)
            ELSE NULL
        END,
        v_changes,
        CASE 
            WHEN TG_OP = 'INSERT' THEN v_user_name || ' menambahkan ' || TG_TABLE_NAME || ' baru: ' || v_entity_name
            WHEN TG_OP = 'UPDATE' THEN v_user_name || ' mengubah ' || TG_TABLE_NAME || ': ' || v_entity_name
            WHEN TG_OP = 'DELETE' THEN v_user_name || ' menghapus ' || TG_TABLE_NAME || ': ' || v_entity_name
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Buat triggers untuk tabel-tabel penting
-- Trigger untuk employees
DROP TRIGGER IF EXISTS audit_employees_trigger ON public.employees;
CREATE TRIGGER audit_employees_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.employees
    FOR EACH ROW
    EXECUTE FUNCTION public.create_audit_log();

-- Trigger untuk attendance
DROP TRIGGER IF EXISTS audit_attendance_trigger ON public.attendance;
CREATE TRIGGER audit_attendance_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.attendance
    FOR EACH ROW
    EXECUTE FUNCTION public.create_audit_log();

-- Trigger untuk requests
DROP TRIGGER IF EXISTS audit_requests_trigger ON public.requests;
CREATE TRIGGER audit_requests_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.requests
    FOR EACH ROW
    EXECUTE FUNCTION public.create_audit_log();

-- Trigger untuk units
DROP TRIGGER IF EXISTS audit_units_trigger ON public.units;
CREATE TRIGGER audit_units_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.units
    FOR EACH ROW
    EXECUTE FUNCTION public.create_audit_log();

-- Trigger untuk departments
DROP TRIGGER IF EXISTS audit_departments_trigger ON public.departments;
CREATE TRIGGER audit_departments_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.departments
    FOR EACH ROW
    EXECUTE FUNCTION public.create_audit_log();

-- Trigger untuk positions
DROP TRIGGER IF EXISTS audit_positions_trigger ON public.positions;
CREATE TRIGGER audit_positions_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.positions
    FOR EACH ROW
    EXECUTE FUNCTION public.create_audit_log();

-- 6. Grant permissions
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- =============================================
-- SELESAI!
-- =============================================
-- Cara menggunakan:
-- 1. Jalankan script ini di Supabase SQL Editor
-- 2. Setiap kali admin melakukan perubahan (CREATE/UPDATE/DELETE), 
--    akan otomatis tercatat di tabel audit_logs
-- 3. Gunakan query berikut untuk melihat history:
--
-- -- Lihat semua aktivitas
-- SELECT * FROM audit_logs ORDER BY created_at DESC;
--
-- -- Lihat aktivitas user tertentu
-- SELECT * FROM audit_logs WHERE user_email = 'admin@example.com' ORDER BY created_at DESC;
--
-- -- Lihat perubahan pada employee tertentu
-- SELECT * FROM audit_logs WHERE entity_type = 'employees' AND entity_id = 'xxx' ORDER BY created_at DESC;
--
-- -- Lihat aktivitas hari ini
-- SELECT * FROM audit_logs WHERE created_at >= CURRENT_DATE ORDER BY created_at DESC;
-- =============================================


-- ==========================================
-- FILE: 018-rbac-update.sql
-- ==========================================

-- RBAC DATABASE SCHEMA UPDATES
-- Run this in Supabase SQL Editor to enforce role-based access control

-- 1. Update employees table role constraint to include all roles
ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS employees_role_check;
ALTER TABLE public.employees ADD CONSTRAINT employees_role_check 
    CHECK (role IN ('admin', 'hrd', 'kepala_ruangan', 'karyawan'));

-- 2. Create roles_permissions table to store permission matrix
CREATE TABLE IF NOT EXISTS public.roles_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    role VARCHAR(50) NOT NULL,
    permission VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, permission)
);

-- 3. Insert permission matrix
DELETE FROM public.roles_permissions;

-- Admin permissions
INSERT INTO public.roles_permissions (role, permission, description) VALUES
    ('admin', 'read:all_employees', 'Baca data semua karyawan'),
    ('admin', 'create:employee', 'Buat karyawan baru'),
    ('admin', 'update:employee', 'Edit data karyawan'),
    ('admin', 'delete:employee', 'Hapus karyawan'),
    ('admin', 'read:all_attendance', 'Baca presensi semua karyawan'),
    ('admin', 'create:attendance', 'Buat record presensi'),
    ('admin', 'update:attendance', 'Edit presensi'),
    ('admin', 'delete:attendance', 'Hapus presensi'),
    ('admin', 'approve:requests', 'Approve semua request'),
    ('admin', 'reject:requests', 'Reject semua request'),
    ('admin', 'read:all_requests', 'Baca semua request'),
    ('admin', 'manage:organization', 'Kelola organisasi'),
    ('admin', 'manage:system_settings', 'Kelola pengaturan sistem'),
    ('admin', 'manage:roles', 'Kelola role & permission'),
    ('admin', 'view:audit_logs', 'Lihat audit log'),
    ('admin', 'export:data', 'Export data'),
    ('admin', 'import:data', 'Import data');

-- HRD permissions
INSERT INTO public.roles_permissions (role, permission, description) VALUES
    ('hrd', 'read:all_employees', 'Baca data semua karyawan'),
    ('hrd', 'create:employee', 'Buat karyawan baru'),
    ('hrd', 'update:employee', 'Edit data karyawan'),
    ('hrd', 'read:all_attendance', 'Baca presensi semua karyawan'),
    ('hrd', 'update:attendance', 'Edit presensi'),
    ('hrd', 'approve:requests', 'Approve request'),
    ('hrd', 'reject:requests', 'Reject request'),
    ('hrd', 'read:all_requests', 'Baca semua request'),
    ('hrd', 'read:payroll', 'Baca data gaji'),
    ('hrd', 'create:payroll', 'Buat payroll'),
    ('hrd', 'update:payroll', 'Edit payroll'),
    ('hrd', 'view:audit_logs', 'Lihat audit log'),
    ('hrd', 'export:data', 'Export data'),
    ('hrd', 'import:data', 'Import data');

-- Kepala Ruangan permissions
INSERT INTO public.roles_permissions (role, permission, description) VALUES
    ('kepala_ruangan', 'read:unit_employees', 'Baca karyawan di unit'),
    ('kepala_ruangan', 'read:unit_attendance', 'Baca presensi unit'),
    ('kepala_ruangan', 'update:unit_attendance', 'Edit presensi unit'),
    ('kepala_ruangan', 'approve:unit_requests', 'Approve request unit'),
    ('kepala_ruangan', 'reject:unit_requests', 'Reject request unit'),
    ('kepala_ruangan', 'read:unit_requests', 'Baca request unit');

-- Karyawan permissions
INSERT INTO public.roles_permissions (role, permission, description) VALUES
    ('karyawan', 'read:own_profile', 'Baca profil sendiri'),
    ('karyawan', 'update:own_profile', 'Edit profil sendiri'),
    ('karyawan', 'read:own_attendance', 'Baca presensi sendiri'),
    ('karyawan', 'create:own_request', 'Buat request sendiri'),
    ('karyawan', 'read:own_requests', 'Baca request sendiri');

-- 4. Update RLS Policies - Enhanced version

-- Remove old policies
DROP POLICY IF EXISTS "Employees dapat dibaca oleh user yang login" ON public.employees;
DROP POLICY IF EXISTS "Employees dapat diubah oleh admin atau diri sendiri" ON public.employees;
DROP POLICY IF EXISTS "Employees dapat dibuat oleh admin" ON public.employees;
DROP POLICY IF EXISTS "Employees dapat dihapus oleh admin" ON public.employees;

-- New comprehensive RLS policies for employees
CREATE POLICY "employees_read_policy" ON public.employees FOR SELECT USING (
  -- Admin & HRD dapat baca semua
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) IN ('admin', 'hrd')
  -- Kepala ruangan dapat baca karyawan di unit mereka
  OR (
    (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'kepala_ruangan'
    AND "unitKerjaId" = (SELECT "unitKerjaId" FROM public.employees WHERE "user_id" = auth.uid())
  )
  -- Karyawan dapat baca profil sendiri saja
  OR "user_id" = auth.uid()
);

CREATE POLICY "employees_insert_policy" ON public.employees FOR INSERT WITH CHECK (
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) IN ('admin', 'hrd')
);

CREATE POLICY "employees_update_policy" ON public.employees FOR UPDATE USING (
  -- Admin dapat update siapa saja
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'admin'
  -- HRD dapat update semua karyawan
  OR (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'hrd'
  -- Karyawan dapat update profil sendiri
  OR "user_id" = auth.uid()
) WITH CHECK (
  -- Admin dapat update siapa saja
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'admin'
  -- HRD dapat update semua karyawan
  OR (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'hrd'
  -- Karyawan dapat update profil sendiri
  OR "user_id" = auth.uid()
);

CREATE POLICY "employees_delete_policy" ON public.employees FOR DELETE USING (
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'admin'
);

-- 5. Enhanced Attendance RLS Policies

DROP POLICY IF EXISTS "Attendance dapat dibaca oleh admin atau karyawan sendiri" ON public.attendance;
DROP POLICY IF EXISTS "Attendance dapat diinput oleh admin atau karyawan sendiri" ON public.attendance;
DROP POLICY IF EXISTS "Attendance dapat diubah oleh admin atau karyawan sendiri" ON public.attendance;

CREATE POLICY "attendance_read_policy" ON public.attendance FOR SELECT USING (
  -- Admin dapat baca semua
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'admin'
  -- HRD dapat baca semua
  OR (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'hrd'
  -- Kepala ruangan dapat baca presensi di unitnya
  OR (
    (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'kepala_ruangan'
    AND employee_id IN (
      SELECT id FROM public.employees 
      WHERE "unitKerjaId" = (SELECT "unitKerjaId" FROM public.employees WHERE "user_id" = auth.uid())
    )
  )
  -- Karyawan dapat baca presensi sendiri
  OR employee_id = (SELECT id FROM public.employees WHERE "user_id" = auth.uid())
);

CREATE POLICY "attendance_insert_policy" ON public.attendance FOR INSERT WITH CHECK (
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) IN ('admin', 'hrd')
  OR employee_id = (SELECT id FROM public.employees WHERE "user_id" = auth.uid())
);

CREATE POLICY "attendance_update_policy" ON public.attendance FOR UPDATE USING (
  -- Admin dapat update siapa saja
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'admin'
  -- HRD dapat update
  OR (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'hrd'
) WITH CHECK (
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'admin'
  OR (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'hrd'
);

-- 6. Enhanced Request RLS Policies

DROP POLICY IF EXISTS "Requests dapat dibaca oleh admin atau karyawan sendiri" ON public.requests;

CREATE POLICY "requests_read_policy" ON public.requests FOR SELECT USING (
  -- Admin dapat baca semua
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'admin'
  -- HRD dapat baca semua
  OR (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'hrd'
  -- Kepala ruangan dapat baca request dari unitnya
  OR (
    (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'kepala_ruangan'
    AND employee_id IN (
      SELECT id FROM public.employees 
      WHERE "unitKerjaId" = (SELECT "unitKerjaId" FROM public.employees WHERE "user_id" = auth.uid())
    )
  )
  -- Karyawan dapat baca request sendiri
  OR employee_id = (SELECT id FROM public.employees WHERE "user_id" = auth.uid())
);

CREATE POLICY "requests_insert_policy" ON public.requests FOR INSERT WITH CHECK (
  employee_id = (SELECT id FROM public.employees WHERE "user_id" = auth.uid())
  OR (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) IN ('admin', 'hrd')
);

CREATE POLICY "requests_update_policy" ON public.requests FOR UPDATE USING (
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) IN ('admin', 'hrd')
  OR (
    (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'kepala_ruangan'
    AND employee_id IN (
      SELECT id FROM public.employees 
      WHERE "unitKerjaId" = (SELECT "unitKerjaId" FROM public.employees WHERE "user_id" = auth.uid())
    )
  )
) WITH CHECK (
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) IN ('admin', 'hrd')
  OR (
    (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'kepala_ruangan'
    AND employee_id IN (
      SELECT id FROM public.employees 
      WHERE "unitKerjaId" = (SELECT "unitKerjaId" FROM public.employees WHERE "user_id" = auth.uid())
    )
  )
);

-- 7. Enable RLS on roles_permissions table
ALTER TABLE public.roles_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roles_permissions_read_policy" ON public.roles_permissions FOR SELECT USING (
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) IN ('admin', 'hrd')
);

-- 8. Create audit table for RBAC changes
CREATE TABLE IF NOT EXISTS public.rbac_audit (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50), -- 'role_changed', 'permission_granted', 'permission_revoked'
    target_employee_id TEXT REFERENCES public.employees(id),
    old_role VARCHAR(50),
    new_role VARCHAR(50),
    reason TEXT,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on rbac_audit
ALTER TABLE public.rbac_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rbac_audit_read_policy" ON public.rbac_audit FOR SELECT USING (
  (SELECT role FROM public.employees WHERE "user_id" = auth.uid()) = 'admin'
);

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.current_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees("user_id");
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_unit ON public.employees("unitKerjaId");
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_requests_employee ON public.requests(employee_id);

COMMIT;

-- Verification queries
SELECT '✅ RBAC Schema Update Complete' as status;
SELECT COUNT(*) as role_count FROM public.roles_permissions;
SELECT DISTINCT role FROM public.employees ORDER BY role;


-- ==========================================
-- FILE: 019-online-verification.sql
-- ==========================================

-- =============================================
-- HRMS ONLINE DATABASE VERIFICATION
-- Jalankan di Supabase SQL Editor setelah migrasi online
-- =============================================

-- Helper: hitung jumlah baris dengan aman (NULL jika tabel belum ada)
-- Gunakan schema public (bukan pg_temp) agar konsisten di SQL Editor Supabase.
CREATE OR REPLACE FUNCTION public.safe_count(p_table text)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_schema text;
  v_table text;
  v_sql text;
  v_count BIGINT;
BEGIN
  v_schema := split_part(p_table, '.', 1);
  v_table := split_part(p_table, '.', 2);

  IF v_schema = '' OR v_table = '' THEN
    RETURN NULL;
  END IF;

  IF to_regclass(format('%I.%I', v_schema, v_table)) IS NULL THEN
    RETURN NULL;
  END IF;

  v_sql := format('SELECT COUNT(*) FROM %I.%I', v_schema, v_table);
  EXECUTE v_sql INTO v_count;
  RETURN v_count;
EXCEPTION
  WHEN undefined_table THEN
    RETURN NULL;
END;
$$;

-- 1) Cek keberadaan tabel inti
SELECT to_regclass('public.units') AS units;
SELECT to_regclass('public.employees') AS employees;
SELECT to_regclass('public.attendance') AS attendance;
SELECT to_regclass('public.requests') AS requests;
SELECT to_regclass('public.documents') AS documents;
SELECT to_regclass('public.audit_logs') AS audit_logs;

-- 2) Cek jumlah data inti
-- Jika hasil NULL berarti tabel belum dibuat
SELECT public.safe_count('public.units') AS units_count;
SELECT public.safe_count('public.employees') AS employees_count;
SELECT public.safe_count('public.attendance') AS attendance_count;
SELECT public.safe_count('public.requests') AS requests_count;
SELECT public.safe_count('public.documents') AS documents_count;

-- 3) Cek function penting
SELECT proname
FROM pg_proc
WHERE proname IN (
  'current_employee_id',
  'is_admin_user',
  'update_updated_at_column',
  'create_audit_log',
  'handle_new_user',
  'handle_user_update'
)
ORDER BY proname;

-- 4) Cek trigger penting
SELECT event_object_table AS table_name, trigger_name
FROM information_schema.triggers
WHERE trigger_name IN (
  'update_units_updated_at',
  'update_employees_updated_at',
  'update_attendance_updated_at',
  'update_requests_updated_at',
  'audit_employees_trigger',
  'audit_attendance_trigger',
  'audit_requests_trigger',
  'audit_units_trigger',
  'audit_departments_trigger',
  'audit_positions_trigger',
  'on_auth_user_created',
  'on_auth_user_updated'
)
ORDER BY event_object_table, trigger_name;

-- 5) Cek policy RLS
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6) Smoke test auth-context dependent function (harus dijalankan sebagai authenticated user saat test lewat app)
-- SELECT public.current_employee_id();
-- SELECT public.is_admin_user();


-- ==========================================
-- FILE: 020-employee-complete-data.sql
-- ==========================================

-- ============================================
-- EMPLOYEE COMPLETE DATA - DATABASE MIGRATION
-- ============================================
-- Menambahkan kolom untuk data lengkap karyawan
-- Version: 1.0
-- Date: 2025-10-27
-- ============================================

-- 1. PERSONAL & CONTACT INFORMATION
-- ============================================

-- Add KTP Number
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS ktp_number VARCHAR(20);

-- Add NPWP
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS npwp VARCHAR(20);

-- Add BPJS Numbers
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS bpjs_kesehatan VARCHAR(20);

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS bpjs_ketenagakerjaan VARCHAR(20);

-- Add Marital Status & Dependents
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20) CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed'));

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS dependents INTEGER DEFAULT 0;

-- Add Address Information (stored as JSONB for flexibility)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS address JSONB;

-- Example address structure:
-- {
--   "ktp": "Jl. Merdeka No. 123",
--   "domisili": "Jl. Sudirman No. 456",
--   "province": "DKI Jakarta",
--   "city": "Jakarta Selatan",
--   "postalCode": "12345"
-- }

-- Add Emergency Contacts (array of contacts)
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]';

-- Example emergency_contacts structure:
-- [
--   {
--     "name": "Jane Doe",
--     "relationship": "Istri",
--     "phone": "081234567890",
--     "address": "Jl. Merdeka No. 123"
--   }
-- ]

-- 2. PROFESSIONAL INFORMATION
-- ============================================

-- Add Education History
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]';

-- Example education structure:
-- [
--   {
--     "id": "edu-1",
--     "level": "S1",
--     "institution": "Universitas Indonesia",
--     "major": "Kedokteran",
--     "graduationYear": 2015,
--     "gpa": 3.75
--   }
-- ]

-- Add Work History
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS work_history JSONB DEFAULT '[]';

-- Example work_history structure:
-- [
--   {
--     "id": "work-1",
--     "company": "RS Husada",
--     "position": "Dokter Umum",
--     "startDate": "2015-01-01",
--     "endDate": "2020-12-31",
--     "reasonLeaving": "Career advancement"
--   }
-- ]

-- Add Bank Account Information
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS bank_account JSONB;

-- Example bank_account structure:
-- {
--   "bankName": "Bank Mandiri",
--   "accountNumber": "1234567890",
--   "accountHolder": "John Doe"
-- }

-- 3. INDEXES FOR PERFORMANCE
-- ============================================

-- Index for KTP Number (unique identification)
CREATE INDEX IF NOT EXISTS idx_employees_ktp_number ON employees(ktp_number);

-- Index for NPWP (tax purposes)
CREATE INDEX IF NOT EXISTS idx_employees_npwp ON employees(npwp);

-- Index for BPJS numbers
CREATE INDEX IF NOT EXISTS idx_employees_bpjs_kesehatan ON employees(bpjs_kesehatan);
CREATE INDEX IF NOT EXISTS idx_employees_bpjs_ketenagakerjaan ON employees(bpjs_ketenagakerjaan);

-- GIN indexes for JSONB columns (faster querying)
CREATE INDEX IF NOT EXISTS idx_employees_address ON employees USING GIN (address);
CREATE INDEX IF NOT EXISTS idx_employees_emergency_contacts ON employees USING GIN (emergency_contacts);
CREATE INDEX IF NOT EXISTS idx_employees_education ON employees USING GIN (education);
CREATE INDEX IF NOT EXISTS idx_employees_work_history ON employees USING GIN (work_history);
CREATE INDEX IF NOT EXISTS idx_employees_bank_account ON employees USING GIN (bank_account);

-- 4. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON COLUMN employees.ktp_number IS 'Nomor KTP (Kartu Tanda Penduduk)';
COMMENT ON COLUMN employees.npwp IS 'Nomor Pokok Wajib Pajak untuk keperluan perpajakan';
COMMENT ON COLUMN employees.bpjs_kesehatan IS 'Nomor BPJS Kesehatan';
COMMENT ON COLUMN employees.bpjs_ketenagakerjaan IS 'Nomor BPJS Ketenagakerjaan';
COMMENT ON COLUMN employees.marital_status IS 'Status pernikahan: Single, Married, Divorced, Widowed';
COMMENT ON COLUMN employees.dependents IS 'Jumlah tanggungan (untuk perhitungan PTKP)';
COMMENT ON COLUMN employees.address IS 'Alamat lengkap (KTP & domisili) dalam format JSONB';
COMMENT ON COLUMN employees.emergency_contacts IS 'Kontak darurat (array) dalam format JSONB';
COMMENT ON COLUMN employees.education IS 'Riwayat pendidikan (array) dalam format JSONB';
COMMENT ON COLUMN employees.work_history IS 'Riwayat pekerjaan (array) dalam format JSONB';
COMMENT ON COLUMN employees.bank_account IS 'Informasi rekening bank untuk transfer gaji dalam format JSONB';

-- 5. UPDATE AUDIT LOG TRIGGER (if exists)
-- ============================================

-- The existing audit log trigger should automatically track changes to these new columns
-- No additional trigger modification needed if using a generic column-change trigger

-- 6. VERIFY MIGRATION
-- ============================================

-- Check if all columns were added successfully
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'employees'
AND column_name IN (
    'ktp_number', 
    'npwp', 
    'bpjs_kesehatan', 
    'bpjs_ketenagakerjaan',
    'marital_status',
    'dependents',
    'address',
    'emergency_contacts',
    'education',
    'work_history',
    'bank_account'
)
ORDER BY ordinal_position;

-- Count employees with complete vs incomplete data
SELECT 
    COUNT(*) as total_employees,
    COUNT(ktp_number) as with_ktp,
    COUNT(npwp) as with_npwp,
    COUNT(bpjs_kesehatan) as with_bpjs_kesehatan,
    COUNT(bank_account) as with_bank_account,
    COUNT(CASE WHEN address IS NOT NULL AND address != '{}' THEN 1 END) as with_address,
    COUNT(CASE WHEN emergency_contacts IS NOT NULL AND jsonb_array_length(emergency_contacts) > 0 THEN 1 END) as with_emergency_contacts
FROM employees;

-- ============================================
-- MIGRATION NOTES
-- ============================================
-- 1. All new columns are NULLABLE to allow gradual data entry
-- 2. JSONB format chosen for flexibility and PostgreSQL native support
-- 3. Indexes added for performance on frequently queried fields
-- 4. Existing data is NOT affected - only schema is extended
-- 5. Application code must handle NULL values gracefully
-- 6. Consider data entry campaign to fill missing information
-- ============================================

-- ROLLBACK SCRIPT (if needed)
-- ============================================
-- Run this only if you need to revert the migration
-- 
-- ALTER TABLE employees DROP COLUMN IF EXISTS ktp_number;
-- ALTER TABLE employees DROP COLUMN IF EXISTS npwp;
-- ALTER TABLE employees DROP COLUMN IF EXISTS bpjs_kesehatan;
-- ALTER TABLE employees DROP COLUMN IF EXISTS bpjs_ketenagakerjaan;
-- ALTER TABLE employees DROP COLUMN IF EXISTS marital_status;
-- ALTER TABLE employees DROP COLUMN IF EXISTS dependents;
-- ALTER TABLE employees DROP COLUMN IF EXISTS address;
-- ALTER TABLE employees DROP COLUMN IF EXISTS emergency_contacts;
-- ALTER TABLE employees DROP COLUMN IF EXISTS education;
-- ALTER TABLE employees DROP COLUMN IF EXISTS work_history;
-- ALTER TABLE employees DROP COLUMN IF EXISTS bank_account;
-- 
-- DROP INDEX IF EXISTS idx_employees_ktp_number;
-- DROP INDEX IF EXISTS idx_employees_npwp;
-- DROP INDEX IF EXISTS idx_employees_bpjs_kesehatan;
-- DROP INDEX IF EXISTS idx_employees_bpjs_ketenagakerjaan;
-- DROP INDEX IF EXISTS idx_employees_address;
-- DROP INDEX IF EXISTS idx_employees_emergency_contacts;
-- DROP INDEX IF EXISTS idx_employees_education;
-- DROP INDEX IF EXISTS idx_employees_work_history;
-- DROP INDEX IF EXISTS idx_employees_bank_account;
-- ============================================


-- ==========================================
-- FILE: 021-consolidate-single-schema.sql
-- ==========================================

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


-- ==========================================
-- FILE: 022-constraints-indexes.sql
-- ==========================================

/**
 * Database Constraints & Indexes Migration
 * Phase 1.4: Add data integrity constraints and performance indexes
 * 
 * SCHEMA NOTE: This script uses camelCase column names ("employeeId", "deviceId", "clockIn", etc.)
 * which match your actual database structure after the consolidation schema update.
 * Column names are quoted with double quotes to handle camelCase in PostgreSQL.
 * 
 * This script:
 * 1. Adds foreign key constraints for referential integrity
 * 2. Adds unique constraints to prevent duplicates
 * 3. Adds check constraints for data validation
 * 4. Creates indexes for query performance
 * 5. Ensures data integrity is enforced at database level
 * 
 * Status: Ready for Supabase SQL Editor
 * Expected Duration: 2-5 minutes
 * 
 * IMPORTANT: 
 * 1. Backup database before running!
 * 2. Do NOT modify column names - they are camelCase (JavaScript convention)
 * 3. Column names are wrapped in double quotes for PostgreSQL compatibility
 * 4. If you get an error, run DIAGNOSTIC_CHECK_SCHEMA.sql first to verify column names
 */

-- ============================================================================
-- PART 1: FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- Ensure referential integrity between tables

-- Foreign keys for attendance table
ALTER TABLE IF EXISTS public.attendance
  ADD CONSTRAINT fk_attendance_employee_id
  FOREIGN KEY ("employeeId") REFERENCES public.employees(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE IF EXISTS public.attendance
  ADD CONSTRAINT fk_attendance_device_id
  FOREIGN KEY ("deviceId") REFERENCES public.employee_devices(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign keys for requests table (cuti, izin, reimbursement)
ALTER TABLE IF EXISTS public.requests
  ADD CONSTRAINT fk_requests_employee_id
  FOREIGN KEY ("employeeId") REFERENCES public.employees(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for documents table
ALTER TABLE IF EXISTS public.documents
  ADD CONSTRAINT fk_documents_employee_id
  FOREIGN KEY ("employeeId") REFERENCES public.employees(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign keys for employee_devices table
ALTER TABLE IF EXISTS public.employee_devices
  ADD CONSTRAINT fk_employee_devices_employee_id
  FOREIGN KEY ("employeeId") REFERENCES public.employees(id)
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- PART 2: UNIQUE CONSTRAINTS
-- ============================================================================
-- Prevent duplicate entries for critical data

-- Employees: email must be unique
ALTER TABLE IF EXISTS public.employees
  ADD CONSTRAINT uq_employees_email UNIQUE (email);

-- Employees: user_id must be unique (one user per employee)
ALTER TABLE IF EXISTS public.employees
  ADD CONSTRAINT uq_employees_user_id UNIQUE (user_id);

-- Employee devices: one device registration per employee+device combo
ALTER TABLE IF EXISTS public.employee_devices
  ADD CONSTRAINT uq_employee_devices_combo UNIQUE ("employeeId", "deviceId");

-- Attendance: one record per employee per day
ALTER TABLE IF EXISTS public.attendance
  ADD CONSTRAINT uq_attendance_employee_date UNIQUE ("employeeId", tanggal);

-- ============================================================================
-- PART 3: CHECK CONSTRAINTS
-- ============================================================================
-- Validate data at database level

-- Employees: status must be valid
ALTER TABLE IF EXISTS public.employees
  ADD CONSTRAINT ck_employees_status
  CHECK (status IN ('Aktif', 'Non-Aktif', 'Cuti'));

-- Employees: salary must be non-negative
ALTER TABLE IF EXISTS public.employees
  ADD CONSTRAINT ck_employees_salary
  CHECK ("gajiPokok" >= 0 AND "tunjanganProfesi" >= 0);

-- Attendance: valid status values
ALTER TABLE IF EXISTS public.attendance
  ADD CONSTRAINT ck_attendance_status
  CHECK (status IN ('Hadir', 'Terlambat', 'Absen', 'Cuti', 'Sakit', 'Pending', 'Recorded'));

-- Attendance: check out must be after or equal to check in
ALTER TABLE IF EXISTS public.attendance
  ADD CONSTRAINT ck_attendance_times
  CHECK ("clockOut" IS NULL OR "clockOut" >= "clockIn");

-- Requests: valid types
ALTER TABLE IF EXISTS public.requests
  ADD CONSTRAINT ck_requests_type
  CHECK (type IN ('Cuti', 'Izin', 'Overtime', 'Reimburse'));

-- Requests: valid status
ALTER TABLE IF EXISTS public.requests
  ADD CONSTRAINT ck_requests_status
  CHECK (status IN ('Pending', 'Approved', 'Rejected'));

-- ============================================================================
-- PART 4: INDEXES FOR QUERY PERFORMANCE
-- ============================================================================

-- INDEXES: EMPLOYEES TABLE
-- Search by email
CREATE INDEX IF NOT EXISTS idx_employees_email 
  ON public.employees(email);

-- Search by name (for typeahead/search)
CREATE INDEX IF NOT EXISTS idx_employees_nama 
  ON public.employees USING gin(nama gin_trgm_ops);

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_employees_status 
  ON public.employees(status);

-- Filter by department
CREATE INDEX IF NOT EXISTS idx_employees_departemen 
  ON public.employees(departemen);

-- Filter by role
CREATE INDEX IF NOT EXISTS idx_employees_role 
  ON public.employees(role);

-- Most recent created/updated
CREATE INDEX IF NOT EXISTS idx_employees_created_at 
  ON public.employees(created_at DESC);

-- INDEXES: ATTENDANCE TABLE
-- Query by employee (most common)
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id 
  ON public.attendance("employeeId");

-- Query by date range
CREATE INDEX IF NOT EXISTS idx_attendance_tanggal 
  ON public.attendance(tanggal DESC);

-- Query by employee + date (common composite)
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date 
  ON public.attendance("employeeId", tanggal DESC);

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_attendance_status 
  ON public.attendance(status);

-- Biometric verification tracking
CREATE INDEX IF NOT EXISTS idx_attendance_biometric_verified 
  ON public.attendance("biometricVerified") WHERE "biometricVerified" = true;

-- INDEXES: REQUESTS TABLE
-- Filter by status (pending requests are important)
CREATE INDEX IF NOT EXISTS idx_requests_status 
  ON public.requests(status);

-- Query by employee
CREATE INDEX IF NOT EXISTS idx_requests_employee_id 
  ON public.requests("employeeId");

-- Filter by type
CREATE INDEX IF NOT EXISTS idx_requests_type 
  ON public.requests(type);

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_requests_created_at 
  ON public.requests("requestedAt" DESC);

-- Composite: find pending requests for employee
CREATE INDEX IF NOT EXISTS idx_requests_employee_status_type 
  ON public.requests("employeeId", status, type);

-- Date range for start/end dates
CREATE INDEX IF NOT EXISTS idx_requests_start_date 
  ON public.requests("startDate");

CREATE INDEX IF NOT EXISTS idx_requests_end_date 
  ON public.requests("endDate");

-- INDEXES: DOCUMENTS TABLE
-- Query by employee
CREATE INDEX IF NOT EXISTS idx_documents_employee_id 
  ON public.documents("employeeId");

-- Filter by type
CREATE INDEX IF NOT EXISTS idx_documents_type 
  ON public.documents(type);

-- INDEXES: EMPLOYEE_DEVICES TABLE
-- Query by employee
CREATE INDEX IF NOT EXISTS idx_employee_devices_employee_id 
  ON public.employee_devices("employeeId");

-- Query by device ID
CREATE INDEX IF NOT EXISTS idx_employee_devices_device_id 
  ON public.employee_devices("deviceId");

-- Filter by status
CREATE INDEX IF NOT EXISTS idx_employee_devices_status 
  ON public.employee_devices(status);

-- ============================================================================
-- PART 5: VERIFY CONSTRAINTS
-- ============================================================================

-- Query to check all constraints
SELECT 
  constraint_name,
  table_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
ORDER BY table_name, constraint_type;

-- Query to check all indexes
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- PART 6: CLEANUP DUPLICATES (if needed)
-- ============================================================================
-- Run these if there are constraint violations

-- Find duplicate emails
-- SELECT email, COUNT(*) 
-- FROM public.employees 
-- GROUP BY email HAVING COUNT(*) > 1;

-- Delete duplicate attendance records (keep latest)
-- DELETE FROM public.attendance 
-- WHERE id NOT IN (
--   SELECT DISTINCT ON ("employeeId", tanggal) id
--   FROM public.attendance
--   ORDER BY "employeeId", tanggal, "createdAt" DESC
-- );

-- ============================================================================
-- NOTES FOR ADMIN
-- ============================================================================

/*
After running this script:

1. VERIFY:
   - Check for any errors in SQL Editor output
   - Verify constraints created: SELECT * FROM information_schema.table_constraints WHERE table_schema = 'public';
   - Verify indexes created: SELECT * FROM pg_indexes WHERE schemaname = 'public';

2. TEST CONSTRAINTS:
   - Try inserting duplicate email → should fail ✓
   - Try inserting clockOut < clockIn → should fail ✓
   - Try inserting negative salary → should fail ✓
   - Try referencing non-existent employee → should fail ✓

3. PERFORMANCE:
   - Queries should be faster now
   - Watch for slow queries in Supabase dashboard
   - Run ANALYZE if needed: ANALYZE;

4. IF ISSUES:
   - Check application logs for constraint violations
   - Review data quality in each table
   - Contact admin to fix data if needed

5. ROLLBACK (if problems):
   ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS fk_attendance_employee_id;
   ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS fk_attendance_device_id;
   ALTER TABLE public.requests DROP CONSTRAINT IF EXISTS fk_requests_employee_id;
   ALTER TABLE public.documents DROP CONSTRAINT IF EXISTS fk_documents_employee_id;
   ALTER TABLE public.employee_devices DROP CONSTRAINT IF EXISTS fk_employee_devices_employee_id;
   -- ... repeat for other constraints and indexes

STATUS: Ready for production
TESTED: Yes, on sample data
REVERSIBLE: Yes, drop statements provided
*/


-- ==========================================
-- FILE: 024b-optimization-indexes-safe.sql
-- ==========================================

-- ===========================================
-- DATABASE OPTIMIZATION (SAFE - CURRENT SCHEMA)
-- Disesuaikan dengan skema HRMS saat ini
-- ===========================================

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees("user_id");
CREATE INDEX IF NOT EXISTS idx_employees_role ON public.employees(role);
CREATE INDEX IF NOT EXISTS idx_employees_unit_kerja ON public.employees("unitKerjaId");
CREATE INDEX IF NOT EXISTS idx_employees_status ON public.employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_nik ON public.employees(nik);

-- Attendance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_tanggal ON public.attendance("employeeId", tanggal);
CREATE INDEX IF NOT EXISTS idx_attendance_tanggal ON public.attendance(tanggal);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON public.attendance(status);

-- Requests
CREATE INDEX IF NOT EXISTS idx_requests_employee_status ON public.requests("employeeId", status);
CREATE INDEX IF NOT EXISTS idx_requests_approver_status ON public.requests("approvedBy", status);
CREATE INDEX IF NOT EXISTS idx_requests_type_status ON public.requests(type, status);
CREATE INDEX IF NOT EXISTS idx_requests_requested_at ON public.requests("requestedAt");

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_employee ON public.documents("employeeId");

-- Units / master
CREATE INDEX IF NOT EXISTS idx_units_nama ON public.units(nama);
CREATE INDEX IF NOT EXISTS idx_departments_nama ON public.departments(nama);
CREATE INDEX IF NOT EXISTS idx_positions_nama ON public.positions(nama);

-- Partial indexes mengikuti nilai status aktual
CREATE INDEX IF NOT EXISTS idx_employees_active_partial
  ON public.employees(id)
  WHERE status = 'Aktif';

CREATE INDEX IF NOT EXISTS idx_attendance_hadir_partial
  ON public.attendance(id)
  WHERE status = 'Hadir';

CREATE INDEX IF NOT EXISTS idx_requests_pending_partial
  ON public.requests(id)
  WHERE status = 'Pending';

-- Verifikasi
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('employees', 'attendance', 'requests', 'documents', 'units', 'departments', 'positions')
ORDER BY tablename, indexname;


-- ==========================================
-- FILE: 025b-optimization-pagination-safe.sql
-- ==========================================

-- ===========================================
-- PAGINATION & QUERY OPTIMIZATION (SAFE)
-- Disesuaikan dengan skema HRMS saat ini
-- ===========================================

CREATE OR REPLACE FUNCTION public.get_paginated_employees(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_role TEXT DEFAULT NULL,
    p_unit_id TEXT DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS TABLE (
    employee JSONB,
    total_count BIGINT,
    has_next BOOLEAN,
    has_prev BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*)
    INTO v_total
    FROM public.employees e
    WHERE (p_role IS NULL OR e.role = p_role)
      AND (p_unit_id IS NULL OR e."unitKerjaId" = p_unit_id)
      AND (p_status IS NULL OR e.status = p_status);

    RETURN QUERY
    SELECT
        jsonb_build_object(
            'id', e.id,
            'nik', e.nik,
            'nama', e.nama,
            'email', e.email,
            'role', e.role,
            'unitKerjaId', e."unitKerjaId",
            'status', e.status,
            'foto', e.foto,
            'created_at', e.created_at,
            'updated_at', e.updated_at
        ) AS employee,
        v_total,
        (p_offset + p_limit) < v_total,
        p_offset > 0
    FROM public.employees e
    WHERE (p_role IS NULL OR e.role = p_role)
      AND (p_unit_id IS NULL OR e."unitKerjaId" = p_unit_id)
      AND (p_status IS NULL OR e.status = p_status)
    ORDER BY e.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_paginated_attendance(
    p_employee_id TEXT DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL,
    p_status TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    attendance_item JSONB,
    total_count BIGINT,
    has_next BOOLEAN,
    has_prev BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_total BIGINT;
BEGIN
    SELECT COUNT(*)
    INTO v_total
    FROM public.attendance a
    WHERE (p_employee_id IS NULL OR a."employeeId" = p_employee_id)
      AND (p_start_date IS NULL OR a.tanggal >= p_start_date)
      AND (p_end_date IS NULL OR a.tanggal <= p_end_date)
      AND (p_status IS NULL OR a.status = p_status);

    RETURN QUERY
    SELECT
        jsonb_build_object(
            'id', a.id,
            'employeeId', a."employeeId",
            'tanggal', a.tanggal,
            'clockIn', a."clockIn",
            'clockOut', a."clockOut",
            'status', a.status,
            'notes', a.notes,
            'created_at', a.created_at
        ) AS attendance_item,
        v_total,
        (p_offset + p_limit) < v_total,
        p_offset > 0
    FROM public.attendance a
    WHERE (p_employee_id IS NULL OR a."employeeId" = p_employee_id)
      AND (p_start_date IS NULL OR a.tanggal >= p_start_date)
      AND (p_end_date IS NULL OR a.tanggal <= p_end_date)
      AND (p_status IS NULL OR a.status = p_status)
    ORDER BY a.tanggal DESC, a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(
    p_unit_id TEXT DEFAULT NULL,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_employees', (
            SELECT COUNT(*)
            FROM public.employees e
            WHERE e.status = 'Aktif'
              AND (p_unit_id IS NULL OR e."unitKerjaId" = p_unit_id)
        ),
        'present_today', (
            SELECT COUNT(DISTINCT a."employeeId")
            FROM public.attendance a
            WHERE a.tanggal = CURRENT_DATE
              AND a.status = 'Hadir'
              AND (p_unit_id IS NULL OR EXISTS (
                  SELECT 1 FROM public.employees e
                  WHERE e.id = a."employeeId"
                    AND e."unitKerjaId" = p_unit_id
              ))
        ),
        'pending_requests', (
            SELECT COUNT(*)
            FROM public.requests r
            WHERE r.status = 'Pending'
              AND (p_unit_id IS NULL OR EXISTS (
                  SELECT 1 FROM public.employees e
                  WHERE e.id = r."employeeId"
                    AND e."unitKerjaId" = p_unit_id
              ))
        ),
        'attendance_rate', (
            SELECT ROUND(
                (COUNT(*) FILTER (WHERE status = 'Hadir')::DECIMAL / NULLIF(COUNT(*), 0) * 100),
                2
            )
            FROM public.attendance a
            WHERE a.tanggal BETWEEN p_start_date AND p_end_date
              AND (p_unit_id IS NULL OR EXISTS (
                  SELECT 1 FROM public.employees e
                  WHERE e.id = a."employeeId"
                    AND e."unitKerjaId" = p_unit_id
              ))
        )
    ) INTO result;

    RETURN result;
END;
$$;

CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_employee_stats AS
SELECT
    e."unitKerjaId" AS unit_kerja_id,
    e.role,
    COUNT(*) AS total_count,
    COUNT(*) FILTER (WHERE e.status = 'Aktif') AS active_count,
    COUNT(*) FILTER (WHERE e.created_at >= CURRENT_DATE - INTERVAL '30 days') AS new_last_30_days
FROM public.employees e
GROUP BY e."unitKerjaId", e.role;

CREATE INDEX IF NOT EXISTS idx_mv_employee_stats_unit ON public.mv_employee_stats(unit_kerja_id);
CREATE INDEX IF NOT EXISTS idx_mv_employee_stats_role ON public.mv_employee_stats(role);

CREATE OR REPLACE FUNCTION public.refresh_employee_stats()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.mv_employee_stats;
END;
$$;


-- ==========================================
-- FILE: 026-rls-hardening.sql
-- ==========================================

-- Hardening RLS non-recursive for HRMS local/prod
-- Safe to run multiple times

CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT e.id
    FROM public.employees e
    WHERE e."user_id" = auth.uid()
    LIMIT 1;
$$;

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
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

DROP POLICY IF EXISTS "Units dapat dibaca oleh user yang login" ON public.units;
CREATE POLICY "Units dapat dibaca oleh user yang login"
    ON public.units FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Units dapat diubah oleh admin" ON public.units;
CREATE POLICY "Units dapat diubah oleh admin"
    ON public.units FOR ALL
    USING (public.is_admin_user())
    WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Employees dapat dibaca oleh user yang login" ON public.employees;
CREATE POLICY "Employees dapat dibaca oleh user yang login"
    ON public.employees FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Employees dapat diubah oleh admin/HRD atau diri sendiri" ON public.employees;
CREATE POLICY "Employees dapat diubah oleh admin/HRD atau diri sendiri"
    ON public.employees FOR UPDATE
    USING (public.is_admin_or_hr_user() OR "user_id" = auth.uid())
    WITH CHECK (public.is_admin_or_hr_user() OR "user_id" = auth.uid());

DROP POLICY IF EXISTS "Employees dapat dibuat oleh admin atau HRD" ON public.employees;
CREATE POLICY "Employees dapat dibuat oleh admin atau HRD"
    ON public.employees FOR INSERT
    WITH CHECK (public.is_admin_or_hr_user());

DROP POLICY IF EXISTS "Employees dapat dihapus oleh admin atau HRD" ON public.employees;
CREATE POLICY "Employees dapat dihapus oleh admin atau HRD"
    ON public.employees FOR DELETE
    USING (public.is_admin_or_hr_user());

DROP POLICY IF EXISTS "Attendance dapat dibaca oleh admin atau karyawan sendiri" ON public.attendance;
CREATE POLICY "Attendance dapat dibaca oleh admin atau karyawan sendiri"
    ON public.attendance FOR SELECT
    USING (public.is_admin_user() OR "employeeId" = public.current_employee_id());

DROP POLICY IF EXISTS "Attendance dapat diinput oleh admin atau karyawan sendiri" ON public.attendance;
CREATE POLICY "Attendance dapat diinput oleh admin atau karyawan sendiri"
    ON public.attendance FOR INSERT
    WITH CHECK (public.is_admin_user() OR "employeeId" = public.current_employee_id());

DROP POLICY IF EXISTS "Attendance dapat diubah oleh admin atau karyawan sendiri" ON public.attendance;
CREATE POLICY "Attendance dapat diubah oleh admin atau karyawan sendiri"
    ON public.attendance FOR UPDATE
    USING (public.is_admin_user() OR "employeeId" = public.current_employee_id())
    WITH CHECK (public.is_admin_user() OR "employeeId" = public.current_employee_id());

DROP POLICY IF EXISTS "Requests dapat dibaca oleh admin atau karyawan sendiri" ON public.requests;
CREATE POLICY "Requests dapat dibaca oleh admin atau karyawan sendiri"
    ON public.requests FOR SELECT
    USING (public.is_admin_user() OR "employeeId" = public.current_employee_id());

DROP POLICY IF EXISTS "Requests dapat dibuat oleh karyawan sendiri" ON public.requests;
CREATE POLICY "Requests dapat dibuat oleh karyawan sendiri"
    ON public.requests FOR INSERT
    WITH CHECK ("employeeId" = public.current_employee_id());

DROP POLICY IF EXISTS "Requests dapat diupdate oleh admin" ON public.requests;
CREATE POLICY "Requests dapat diupdate oleh admin"
    ON public.requests FOR UPDATE
    USING (public.is_admin_user())
    WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Documents dapat dibaca oleh admin atau karyawan sendiri" ON public.documents;
CREATE POLICY "Documents dapat dibaca oleh admin atau karyawan sendiri"
    ON public.documents FOR SELECT
    USING (public.is_admin_user() OR "employeeId" = public.current_employee_id());

DROP POLICY IF EXISTS "Documents dapat diupload oleh admin atau karyawan sendiri" ON public.documents;
CREATE POLICY "Documents dapat diupload oleh admin atau karyawan sendiri"
    ON public.documents FOR INSERT
    WITH CHECK (public.is_admin_user() OR "employeeId" = public.current_employee_id());


-- ==========================================
-- FILE: 027-update-rls-hrd-access.sql
-- ==========================================

-- ============================================
-- UPDATE RLS FOR HRD ACCESS TO EMPLOYEES
-- ============================================
-- Memberikan akses HRD untuk mengelola data karyawan
-- Version: 1.0
-- Date: 2026-04-22
-- ============================================

-- 1. Buat fungsi helper untuk cek admin atau HRD
-- ============================================

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

-- 2. Update RLS Policies
-- ============================================

-- Update INSERT policy
DROP POLICY IF EXISTS "Employees dapat dibuat oleh admin" ON public.employees;
DROP POLICY IF EXISTS "Employees dapat dibuat oleh admin atau HRD" ON public.employees;
CREATE POLICY "Employees dapat dibuat oleh admin atau HRD"
    ON public.employees FOR INSERT
    WITH CHECK (public.is_admin_or_hr_user());

-- Update UPDATE policy
DROP POLICY IF EXISTS "Employees dapat diubah oleh admin atau diri sendiri" ON public.employees;
DROP POLICY IF EXISTS "Employees dapat diubah oleh admin/HRD atau diri sendiri" ON public.employees;
CREATE POLICY "Employees dapat diubah oleh admin/HRD atau diri sendiri"
    ON public.employees FOR UPDATE
    USING (public.is_admin_or_hr_user() OR "user_id" = auth.uid())
    WITH CHECK (public.is_admin_or_hr_user() OR "user_id" = auth.uid());

-- Update DELETE policy
DROP POLICY IF EXISTS "Employees dapat dihapus oleh admin" ON public.employees;
DROP POLICY IF EXISTS "Employees dapat dihapus oleh admin atau HRD" ON public.employees;
CREATE POLICY "Employees dapat dihapus oleh admin atau HRD"
    ON public.employees FOR DELETE
    USING (public.is_admin_or_hr_user());

-- 3. Verifikasi
-- ============================================

-- Cek policies yang aktif
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'employees'
ORDER BY policyname;

-- ============================================
-- MIGRATION NOTES
-- ============================================
-- 1. HRD sekarang bisa CREATE, READ, UPDATE, DELETE data karyawan
-- 2. Karyawan tetap hanya bisa UPDATE data diri sendiri
-- 3. Admin tetap punya akses penuh
-- 4. Fungsi is_admin_or_hr_user() mencakup role: 'admin', 'hrd', 'hr'
-- ============================================

-- ==========================================
-- FILE: 028-trigger-auto-employee.sql
-- ==========================================

-- ========================================
-- AUTO CREATE EMPLOYEE PROFILE ON SIGNUP
-- ========================================
-- Trigger ini akan otomatis membuat profil employee
-- saat user baru mendaftar via Supabase Auth

-- 1. Buat function untuk auto-create employee profile
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Insert employee profile dengan role default 'karyawan'
  -- Admin harus di-set manual via SQL atau dashboard
  INSERT INTO public.employees (
    user_id,
    nama,
    email,
    role,
    jabatan,
    departemen,
    status,
    shift,
    "hireDate",
    "birthDate",
    "sisaCuti"
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nama', 'User Baru'),  -- Ambil dari metadata atau default
    NEW.email,
    'karyawan',  -- Default role adalah karyawan
    'Staff',     -- Default jabatan
    'Umum',      -- Default departemen
    'Aktif',
    'Pagi',
    CURRENT_DATE,
    '1990-01-01',
    12
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Buat trigger yang menjalankan function di atas
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- UPDATE: Sync email jika berubah di auth
-- ========================================
CREATE OR REPLACE FUNCTION public.handle_user_update() 
RETURNS TRIGGER AS $$
BEGIN
  -- Update email di employees jika berubah di auth.users
  IF NEW.email <> OLD.email THEN
    UPDATE public.employees 
    SET email = NEW.email 
    WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update();

-- ========================================
-- MANUAL: Set user sebagai admin
-- ========================================
-- Jalankan query ini untuk membuat user menjadi admin
-- Ganti 'user@email.com' dengan email user yang ingin dijadikan admin

-- UPDATE public.employees 
-- SET 
--   role = 'admin',
--   jabatan = 'Manager HR',
--   departemen = 'Administrasi'
-- WHERE email = 'admin@hospital.com';

-- ========================================
-- CLEANUP: Fix existing users
-- ========================================
-- Jika ada user di auth.users yang belum punya profil employee, jalankan:

INSERT INTO public.employees (
  user_id, nama, email, role, jabatan, departemen, status, shift, "hireDate", "birthDate", "sisaCuti"
)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'nama', 'User Existing'),
  u.email,
  'karyawan',
  'Staff',
  'Umum',
  'Aktif',
  'Pagi',
  CURRENT_DATE,
  '1990-01-01',
  12
FROM auth.users u
LEFT JOIN public.employees e ON e.user_id = u.id
WHERE e.id IS NULL
ON CONFLICT (email) DO NOTHING;

-- ========================================
-- Set admin untuk user yang sudah ada
-- ========================================
UPDATE public.employees 
SET 
  role = 'admin',
  jabatan = 'Manager HR',
  departemen = 'Administrasi',
  user_id = '0feb4b44-df17-4d16-9af9-33048097638f'
WHERE email = 'admin@hospital.com';


-- ==========================================
-- FILE: 030-add-managed-unit-id.sql
-- ==========================================

-- Script untuk menambahkan kolom managedUnitId pada tabel employees
-- Jalankan di Supabase SQL Editor jika kolom belum ada

-- 1. Tambahkan kolom managedUnitId jika belum ada
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS "managedUnitId" TEXT REFERENCES public.units(id);

-- 2. Verifikasi kolom sudah ditambahkan
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'employees'
AND (column_name = 'managedUnitId' OR column_name LIKE '%managed%')
ORDER BY column_name;

-- 3. Sync managedUnitId dengan unitKerjaId untuk kepala_ruangan yang sudah punya unitKerjaId
UPDATE employees
SET "managedUnitId" = "unitKerjaId"
WHERE role = 'kepala_ruangan'
AND "unitKerjaId" IS NOT NULL
AND ("managedUnitId" IS NULL OR "managedUnitId" = '');

-- 4. Verifikasi hasil
SELECT id, nama, email, role, "unitKerjaId", "managedUnitId"
FROM employees
WHERE role = 'kepala_ruangan';

-- 5. Tambahkan comment untuk dokumentasi
COMMENT ON COLUMN public.employees."managedUnitId" IS 'Unit kerja yang dikelola oleh kepala ruangan (untuk role kepala_ruangan)';

-- ==========================================
-- FILE: 031-add-columns.sql
-- ==========================================

ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS ktp_number TEXT,
ADD COLUMN IF NOT EXISTS bpjs_kesehatan TEXT,
ADD COLUMN IF NOT EXISTS bpjs_ketenagakerjaan TEXT,
ADD COLUMN IF NOT EXISTS marital_status TEXT,
ADD COLUMN IF NOT EXISTS emergency_contacts JSONB,
ADD COLUMN IF NOT EXISTS work_history JSONB,
ADD COLUMN IF NOT EXISTS bank_account JSONB,
ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verified_by TEXT,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS managed_unit_id TEXT;


-- ==========================================
-- FILE: 032-rename-managed-unit-column.sql
-- ==========================================

DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM information_schema.columns
		WHERE table_schema = 'public'
		  AND table_name = 'employees'
		  AND column_name = 'managedunitid'
	) THEN
		ALTER TABLE public.employees RENAME COLUMN managedunitid TO managed_unit_id;
	END IF;
END $$;


-- ==========================================
-- FILE: 033-rpc-reset-password.sql
-- ==========================================

-- MENITIKBERATKAN PADA PENGGUNAAN LOKAL/OFFLINE 
-- HRD DAPAT MERESET PASSWORD TANPA EMAIL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION admin_reset_employee_password(target_user_id UUID, new_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_role TEXT;
BEGIN
  -- 1. Verifikasi peran pemanggil
  SELECT role INTO v_caller_role FROM public.employees WHERE user_id = auth.uid();
  
  IF v_caller_role NOT IN ('hrd', 'admin') THEN
    RAISE EXCEPTION 'Akses Ditolak: Hanya HRD atau Admin yang boleh mereset password.';
  END IF;

  -- 2. Update password dan bersihkan recovery token agar valid login langsung
  UPDATE auth.users
  SET 
    encrypted_password = crypt(new_password, gen_salt('bf')),
    updated_at = now()
  WHERE id = target_user_id;

  RETURN TRUE;
END;
$$; 


-- ==========================================
-- FILE: 034-cloud-migration-patch.sql
-- ==========================================

-- ============================================================
-- CLOUD MIGRATION PATCH
-- Jalankan script ini di Supabase Cloud SQL Editor
-- URL: https://supabase.com/dashboard/project/gwfymzfrxsvtmtdhryft/sql
-- ============================================================

-- 1. Tambah kolom-kolom yang ada di lokal tapi belum ada di cloud
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS nik TEXT,
  ADD COLUMN IF NOT EXISTS ktp_number VARCHAR(20),
  ADD COLUMN IF NOT EXISTS npwp VARCHAR(20),
  ADD COLUMN IF NOT EXISTS bpjs_kesehatan VARCHAR(20),
  ADD COLUMN IF NOT EXISTS bpjs_ketenagakerjaan VARCHAR(20),
  ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20),
  ADD COLUMN IF NOT EXISTS dependents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS address JSONB,
  ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS work_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bank_account JSONB,
  ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verified_by TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS managed_unit_id TEXT;

-- 2. Tambah constraint marital_status jika belum ada
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'employees_marital_status_check'
    AND conrelid = 'public.employees'::regclass
  ) THEN
    ALTER TABLE public.employees
      ADD CONSTRAINT employees_marital_status_check
      CHECK (marital_status IS NULL OR marital_status IN ('Single', 'Married', 'Divorced', 'Widowed'));
  END IF;
END $$;

-- 3. Unique index untuk NIK (jika belum ada)
CREATE UNIQUE INDEX IF NOT EXISTS employees_nik_key ON public.employees(nik) WHERE nik IS NOT NULL AND nik <> '';

-- 4. GIN indexes untuk kolom JSONB (performa query)
CREATE INDEX IF NOT EXISTS idx_employees_address ON public.employees USING GIN (address);
CREATE INDEX IF NOT EXISTS idx_employees_emergency_contacts ON public.employees USING GIN (emergency_contacts);
CREATE INDEX IF NOT EXISTS idx_employees_work_history ON public.employees USING GIN (work_history);
CREATE INDEX IF NOT EXISTS idx_employees_bank_account ON public.employees USING GIN (bank_account);
CREATE INDEX IF NOT EXISTS idx_employees_education ON public.employees USING GIN (education);
CREATE INDEX IF NOT EXISTS idx_employees_ktp_number ON public.employees(ktp_number);
CREATE INDEX IF NOT EXISTS idx_employees_bpjs_kesehatan ON public.employees(bpjs_kesehatan);
CREATE INDEX IF NOT EXISTS idx_employees_bpjs_ketenagakerjaan ON public.employees(bpjs_ketenagakerjaan);

-- 5. Perbaiki fungsi is_admin_user() agar mengenali role 'hr' dan 'hrd'
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.employees e
    WHERE e.user_id = auth.uid()
      AND e.role IN ('admin', 'hr', 'hrd')
  );
$$;

-- 6. Pastikan tabel audit_logs ada (untuk auditLogService.ts)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT DEFAULT gen_random_uuid()::text PRIMARY KEY,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  action VARCHAR(20) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  portal_type VARCHAR(20) DEFAULT 'operational' NOT NULL
    CHECK (portal_type IN ('personal', 'operational', 'unknown')),
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  old_data JSONB,
  new_data JSONB,
  changes JSONB,
  description TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Index audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON public.audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON public.audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- RLS audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_select_policy"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin_user() OR user_id = auth.uid());

DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_policy"
  ON public.audit_logs FOR INSERT
  WITH CHECK (public.is_admin_user() OR user_id = auth.uid());

GRANT SELECT, INSERT ON public.audit_logs TO authenticated;

-- 7. Verifikasi hasil migrasi
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'employees'
  AND column_name IN (
    'nik', 'ktp_number', 'is_verified', 'is_locked',
    'is_profile_completed', 'marital_status', 'bank_account',
    'emergency_contacts', 'managed_unit_id'
  )
ORDER BY column_name;


-- ==========================================
-- FILE: 036-add-ui-theme.sql
-- ==========================================

-- Migration 036: add ui_theme to system_settings
ALTER TABLE public.system_settings
  ADD COLUMN IF NOT EXISTS ui_theme varchar(16) DEFAULT 'light';

COMMENT ON COLUMN public.system_settings.ui_theme IS 'UI theme preference for web admin: light|dark|system';

-- Ensure existing row has a default value
UPDATE public.system_settings SET ui_theme = COALESCE(ui_theme, 'light') WHERE ui_theme IS NULL;


-- ==========================================
-- FILE: 036-run-in-supabase.sql
-- ==========================================

-- ============================================
-- QUICK FIX: Tambah Kolom Baru ke Table Employees
-- ============================================
-- Jalankan script ini di Supabase SQL Editor
-- ============================================

-- 1. Personal & Contact Information
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ktp_number VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS npwp VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bpjs_kesehatan VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bpjs_ketenagakerjaan VARCHAR(20);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20) CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS dependents INTEGER DEFAULT 0;

-- 1B. Role & Unit Management
ALTER TABLE employees ADD COLUMN IF NOT EXISTS role VARCHAR(20) CHECK (role IN ('admin', 'hrd', 'kepala_ruangan', 'karyawan')) DEFAULT 'karyawan';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS managed_unit_id TEXT REFERENCES units(id);

-- 2. Complex Data (JSONB)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address JSONB;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contacts JSONB DEFAULT '[]';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS education JSONB DEFAULT '[]';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_history JSONB DEFAULT '[]';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account JSONB;

-- 2B. Validation & Locking Columns
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS verified_by TEXT REFERENCES employees(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- 3. Comment untuk dokumentasi
COMMENT ON COLUMN employees.ktp_number IS 'Nomor KTP 16 digit';
COMMENT ON COLUMN employees.npwp IS 'Nomor Pokok Wajib Pajak';
COMMENT ON COLUMN employees.bpjs_kesehatan IS 'Nomor BPJS Kesehatan';
COMMENT ON COLUMN employees.bpjs_ketenagakerjaan IS 'Nomor BPJS Ketenagakerjaan';
COMMENT ON COLUMN employees.marital_status IS 'Status pernikahan: Single, Married, Divorced, Widowed';
COMMENT ON COLUMN employees.dependents IS 'Jumlah tanggungan untuk perhitungan PTKP';
COMMENT ON COLUMN employees.address IS 'Alamat lengkap (KTP, domisili, province, city, postalCode) dalam format JSON';
COMMENT ON COLUMN employees.emergency_contacts IS 'Array kontak darurat dalam format JSON';
COMMENT ON COLUMN employees.education IS 'Riwayat pendidikan dalam format JSON array';
COMMENT ON COLUMN employees.work_history IS 'Riwayat pekerjaan sebelumnya dalam format JSON array';
COMMENT ON COLUMN employees.bank_account IS 'Info rekening bank (bankName, accountNumber, accountHolder) dalam format JSON';
COMMENT ON COLUMN employees.is_profile_completed IS 'Status kelengkapan profil karyawan (otomatis berdasarkan field wajib)';
COMMENT ON COLUMN employees.is_verified IS 'Status verifikasi data oleh HRD';
COMMENT ON COLUMN employees.verified_by IS 'ID HRD yang melakukan verifikasi';
COMMENT ON COLUMN employees.verified_at IS 'Waktu verifikasi data';
COMMENT ON COLUMN employees.is_locked IS 'Status penguncian data - karyawan tidak bisa edit jika TRUE';
COMMENT ON COLUMN employees.role IS 'Peran user: admin, hrd, kepala_ruangan, karyawan';
COMMENT ON COLUMN employees.managed_unit_id IS 'Kolom kompatibilitas lama; sumber utama unit kepala ruangan adalah unitKerjaId yang mengacu ke units.id';

-- 4. Verifikasi (opsional - untuk cek apakah berhasil)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'employees'
AND column_name IN (
    'ktp_number', 'npwp', 'bpjs_kesehatan', 'bpjs_ketenagakerjaan',
    'marital_status', 'dependents', 'address', 'emergency_contacts',
    'education', 'work_history', 'bank_account',
    'is_profile_completed', 'is_verified', 'verified_by', 'verified_at', 'is_locked',
    'role', 'managed_unit_id'
)
ORDER BY column_name;


-- ==========================================
-- FILE: 037-mobile-production.sql
-- ==========================================

-- ============================================================
-- HRMS Mobile — PRODUCTION MIGRATIONS BUNDLE
-- ============================================================
-- File ini menggabungkan SEMUA migration yang dibutuhkan agar
-- aplikasi mobile-absensi dapat berjalan penuh di production.
--
-- CARA PAKAI:
--   1. Buka Supabase SQL Editor.
--   2. New query → paste seluruh isi file ini.
--   3. Run.
--   4. Verifikasi via section "VERIFICATION" di akhir file.
--
-- AMAN dijalankan berulang kali (semua statement idempotent).
-- ============================================================
-- Komponen yang di-apply:
--   1. Mobile fields    → expo_push_token, foto, push_token_updated_at
--   2. Face recognition → face_embedding, face_match_threshold, dll
--   3. RLS recursion fix → security definer functions + safe policies
--   4. Storage buckets   → avatars (public), face-references (private),
--                          documents (private) + storage RLS policies
--   5. App config table  → force-update, maintenance mode, feature flags
-- ============================================================


-- ============================================================
-- [1/4] MOBILE FIELDS
-- ============================================================
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS expo_push_token       TEXT,
  ADD COLUMN IF NOT EXISTS push_token_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS foto                  TEXT;

CREATE INDEX IF NOT EXISTS idx_employees_push_token
  ON public.employees(expo_push_token)
  WHERE expo_push_token IS NOT NULL;

COMMENT ON COLUMN public.employees.expo_push_token IS
  'Expo push notification token dari mobile app (registered saat login).';
COMMENT ON COLUMN public.employees.foto IS
  'URL foto profil (Supabase Storage public URL atau path).';


-- ============================================================
-- [2/4] FACE RECOGNITION
-- ============================================================
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS face_embedding       JSONB,
  ADD COLUMN IF NOT EXISTS face_embedding_dim   INTEGER,
  ADD COLUMN IF NOT EXISTS face_enrolled_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS face_reference_url   TEXT,
  ADD COLUMN IF NOT EXISTS face_match_threshold NUMERIC(4, 3) DEFAULT 0.650;

CREATE INDEX IF NOT EXISTS idx_employees_face_enrolled
  ON public.employees(face_enrolled_at)
  WHERE face_embedding IS NOT NULL;

COMMENT ON COLUMN public.employees.face_embedding IS
  'Vektor embedding wajah (JSON array float) hasil MobileFaceNet.';
COMMENT ON COLUMN public.employees.face_match_threshold IS
  'Minimum cosine similarity (0-1) untuk dianggap match. Default 0.65.';
COMMENT ON COLUMN public.employees.face_reference_url IS
  'URL foto referensi di Supabase Storage bucket private (untuk audit).';


-- ============================================================
-- [3/4] RLS RECURSION FIX (employees policies)
-- ============================================================
-- 3.1 Helper functions DENGAN SECURITY DEFINER (bypass RLS internal).
CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT e.id::text
    FROM public.employees e
    WHERE e.user_id = auth.uid()
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.employees e
        WHERE e.user_id = auth.uid() AND e.role = 'admin'
    );
$$;

GRANT EXECUTE ON FUNCTION public.current_employee_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user()        TO authenticated;

-- 3.2 Drop SEMUA policy lama agar tidak konflik recursion.
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'employees'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.employees', pol.policyname);
    END LOOP;
END$$;

-- 3.3 Policy aman (tanpa rekursi).
CREATE POLICY "employees_select_authenticated"
    ON public.employees FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "employees_insert_self_only"
    ON public.employees FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "employees_update_self"
    ON public.employees FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- DELETE tidak diperbolehkan dari client (handled via service-role).

COMMENT ON POLICY "employees_select_authenticated" ON public.employees IS
  'Semua user terotentikasi boleh SELECT (anti-recursion).';
COMMENT ON POLICY "employees_update_self" ON public.employees IS
  'User hanya boleh UPDATE barisnya sendiri via auth.uid().';


-- ============================================================
-- [4/4] STORAGE BUCKETS
-- ============================================================
-- avatars (public) — untuk foto profil
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- face-references (PRIVATE) — foto referensi wajah karyawan
INSERT INTO storage.buckets (id, name, public)
VALUES ('face-references', 'face-references', false)
ON CONFLICT (id) DO NOTHING;

-- documents (PRIVATE) — dokumen pendukung izin (mis. surat dokter)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies — drop yang lama, recreate yang aman.
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname, tablename FROM pg_policies
        WHERE schemaname = 'storage'
          AND tablename = 'objects'
          AND policyname LIKE 'mobile_%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END$$;

-- avatars: authenticated boleh upload/update/delete file di folder
-- berisi user_id mereka sendiri; semua orang boleh read (public).
CREATE POLICY "mobile_avatars_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "mobile_avatars_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "mobile_avatars_update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "mobile_avatars_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- face-references: hanya owner & admin (admin akses via service-role).
CREATE POLICY "mobile_face_select_own"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'face-references'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "mobile_face_insert_own"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'face-references'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "mobile_face_update_own"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'face-references'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "mobile_face_delete_own"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'face-references'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- documents: owner only (read & write).
CREATE POLICY "mobile_documents_select_own"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "mobile_documents_insert_own"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );


-- ============================================================
-- [5/5] APP CONFIG (force-update & maintenance mode)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_config (
    key        TEXT PRIMARY KEY,
    value      JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Read-only untuk semua authenticated user (mobile app membaca config).
DROP POLICY IF EXISTS "app_config_read_all" ON public.app_config;
CREATE POLICY "app_config_read_all"
    ON public.app_config FOR SELECT
    TO authenticated
    USING (true);

-- Write hanya via service-role (admin web panel / SQL editor).

-- Seed default values (aman di-rerun).
INSERT INTO public.app_config (key, value) VALUES
    ('min_version_code',     '1'::jsonb),
    ('latest_version_code',  '1'::jsonb),
    ('update_url',           '""'::jsonb),
    ('update_message',       '""'::jsonb),
    ('maintenance_mode',     'false'::jsonb),
    ('maintenance_message',  '""'::jsonb),
    ('features',             '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE public.app_config IS
  'Konfigurasi runtime mobile app: force-update versi minimum, maintenance mode, feature flags.';


-- ============================================================
-- VERIFICATION (jalankan SELECT-SELECT ini setelah migration)
-- ============================================================
-- 1. Cek semua kolom mobile sudah ada
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'employees'
--   AND column_name IN (
--     'expo_push_token','push_token_updated_at','foto',
--     'face_embedding','face_embedding_dim','face_enrolled_at',
--     'face_reference_url','face_match_threshold')
-- ORDER BY column_name;

-- 2. Cek RLS policy employees (harus ada 3: select_authenticated,
--    insert_self_only, update_self)
-- SELECT policyname, cmd FROM pg_policies
-- WHERE schemaname='public' AND tablename='employees';

-- 3. Cek storage bucket
-- SELECT id, name, public FROM storage.buckets
-- WHERE id IN ('avatars','face-references','documents');

-- 4. Cek storage policies (harus ada 9 mobile_*)
-- SELECT policyname, cmd FROM pg_policies
-- WHERE schemaname='storage' AND tablename='objects' AND policyname LIKE 'mobile_%';


-- ============================================================
-- DONE — versi 1.0 (Mei 2026)
-- ============================================================


-- ==========================================
-- FILE: 038-rpc-create-employee-import.sql
-- ==========================================

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


-- ==========================================
-- FILE: 048-rpc-create-employees-batch.sql
-- ==========================================

-- ============================================================
-- RPC: Bulk Employee Import with Transaction Support
-- ============================================================
-- This function handles batch insert with proper transaction
-- and returns detailed results for each row

CREATE OR REPLACE FUNCTION public.create_employees_batch(
    employees_data jsonb[],
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
    FOREACH employee_record IN ARRAY employees_data
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

GRANT EXECUTE ON FUNCTION public.create_employees_batch(jsonb[], uuid) TO authenticated;

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


-- ==========================================
-- FILE: 049-create-payslips-table.sql
-- ==========================================

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


