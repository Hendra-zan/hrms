-- Create employee-documents storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('employee-documents', 'employee-documents', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for employee-documents
DROP POLICY IF EXISTS "employee_documents_select" ON storage.objects;
CREATE POLICY "employee_documents_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'employee-documents');

DROP POLICY IF EXISTS "employee_documents_insert" ON storage.objects;
CREATE POLICY "employee_documents_insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'employee-documents');

DROP POLICY IF EXISTS "employee_documents_update" ON storage.objects;
CREATE POLICY "employee_documents_update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'employee-documents');

DROP POLICY IF EXISTS "employee_documents_delete" ON storage.objects;
CREATE POLICY "employee_documents_delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'employee-documents');

-- Grant select access to units table
GRANT SELECT ON public.units TO authenticated, anon, service_role;
