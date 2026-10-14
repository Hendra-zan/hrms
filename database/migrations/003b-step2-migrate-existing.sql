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
