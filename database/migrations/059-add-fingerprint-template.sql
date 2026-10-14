-- Migration 059: Add Fingerprint Biometric Columns to Employees & Employee Devices
-- Supports DigitalPersona U.are.U 4500 ANSI-378 fingerprint templates

ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS fingerprint_template TEXT,
  ADD COLUMN IF NOT EXISTS fingerprint_format VARCHAR(50) DEFAULT 'ANSI-378',
  ADD COLUMN IF NOT EXISTS fingerprint_enrolled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fingerprint_verification_enabled BOOLEAN DEFAULT true;

COMMENT ON COLUMN employees.fingerprint_template IS 'Base64 encoded minutiae template (ANSI-378 / ISO-19794-2)';
COMMENT ON COLUMN employees.fingerprint_enrolled_at IS 'Timestamp when fingerprint was registered';
COMMENT ON COLUMN employees.fingerprint_verification_enabled IS 'Whether fingerprint verification is enabled for this employee';

-- Also add to employee_devices if device-specific template storage is used
ALTER TABLE public.employee_devices
  ADD COLUMN IF NOT EXISTS "fingerprintTemplate" TEXT,
  ADD COLUMN IF NOT EXISTS "fingerprintEnrolledAt" TIMESTAMPTZ;

-- Performance index
CREATE INDEX IF NOT EXISTS idx_employees_fingerprint_enrolled
ON employees(fingerprint_enrolled_at)
WHERE fingerprint_enrolled_at IS NOT NULL;
