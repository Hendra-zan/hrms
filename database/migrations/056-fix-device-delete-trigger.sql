-- Fix constraint conflict when deleting employee devices
CREATE OR REPLACE FUNCTION public.log_device_change()
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
            NULL, -- Set to NULL to prevent foreign key constraint violation on biometric_audit_log_device_id_fkey
            'device_removed',
            'success',
            jsonb_build_object(
                'device_id', OLD.id, -- Store the deleted device ID in metadata instead
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
