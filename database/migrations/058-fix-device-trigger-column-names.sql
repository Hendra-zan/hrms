-- Emergency fix: Correct column names in log_device_change trigger
-- The employee_devices table uses camelCase column names (quoted identifiers)
-- Previous trigger used snake_case which caused NULL employee_id errors

CREATE OR REPLACE FUNCTION public.log_device_change()
RETURNS TRIGGER AS $$
DECLARE
    v_employee_id TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Use quoted camelCase column names matching the actual table schema
        INSERT INTO public.biometric_audit_log 
        (employee_id, device_id, action, status, metadata, created_at)
        VALUES (
            NEW."employeeId",
            NEW.id,
            'device_registered',
            'success',
            jsonb_build_object(
                'platform', NEW.platform,
                'device_name', NEW."deviceName",
                'is_primary', NEW."isPrimary"
            ),
            NOW()
        );
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' AND (
        OLD.status IS DISTINCT FROM NEW.status OR
        OLD.platform IS DISTINCT FROM NEW.platform OR
        OLD."deviceName" IS DISTINCT FROM NEW."deviceName" OR
        OLD."isPrimary" IS DISTINCT FROM NEW."isPrimary"
    ) THEN
        INSERT INTO public.biometric_audit_log 
        (employee_id, device_id, action, status, metadata, created_at)
        VALUES (
            NEW."employeeId",
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
                'old_device_name', OLD."deviceName",
                'new_device_name', NEW."deviceName",
                'old_is_primary', OLD."isPrimary",
                'new_is_primary', NEW."isPrimary"
            ),
            NOW()
        );
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        -- CRITICAL: Use NULL for device_id to avoid FK violation (device is being deleted)
        -- Store the actual device ID in metadata for audit trail
        INSERT INTO public.biometric_audit_log 
        (employee_id, device_id, action, status, metadata, created_at)
        VALUES (
            OLD."employeeId",
            NULL,  -- NULL prevents FK constraint violation on biometric_audit_log_device_id_fkey
            'device_removed',
            'success',
            jsonb_build_object(
                'device_id', OLD.id,
                'platform', OLD.platform,
                'device_name', OLD."deviceName"
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
