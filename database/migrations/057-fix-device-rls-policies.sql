-- Fix: Update employee_devices DELETE policy to also allow service_role bypass
-- and update is_admin_user() to be more resilient

-- Drop and recreate the delete policy with service_role support
DROP POLICY IF EXISTS "employee_devices_delete_admin" ON public.employee_devices;

CREATE POLICY "employee_devices_delete_admin"
    ON public.employee_devices FOR DELETE
    USING (
        auth.role() = 'service_role'
        OR is_admin_user()
    );

-- Also fix the update policy the same way (status update also blocked)
DROP POLICY IF EXISTS "employee_devices_update_admin" ON public.employee_devices;

CREATE POLICY "employee_devices_update_admin"
    ON public.employee_devices FOR UPDATE
    USING (
        auth.role() = 'service_role'
        OR is_admin_user()
    )
    WITH CHECK (
        auth.role() = 'service_role'
        OR is_admin_user()
    );

-- Fix: Grant all necessary table-level privileges to service_role
-- (In self-hosted Supabase the service_role may not have these by default)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employee_devices TO service_role;
