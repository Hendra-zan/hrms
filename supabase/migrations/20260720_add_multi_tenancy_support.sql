-- ============================================================
-- Migration: Support Multi-Tenancy (Multi-Hospital Isolation)
-- Tujuan   : Menambahkan struktur tenant_id untuk isolasi data antar RS/Instansi
-- ============================================================

-- 1. Buat Tabel Tenants (Daftar Rumah Sakit / Instansi)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(50),
  email VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Suspended')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Sisipkan Default Tenant (RS Utama / Operational Existing)
INSERT INTO public.tenants (id, code, name, status)
VALUES ('00000000-0000-0000-0000-000000000001', 'RSUMELOY', 'RSU Meloy', 'Active')
ON CONFLICT (id) DO NOTHING;

-- 3. Tambah kolom tenant_id pada tabel-tabel utama
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.units
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.positions
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';

ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001';

-- 4. Indeks Cepat tenant_id
CREATE INDEX IF NOT EXISTS idx_employees_tenant_id ON public.employees(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_id ON public.attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_units_tenant_id ON public.units(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_tenant_id ON public.departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_positions_tenant_id ON public.positions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);

-- 5. Komentar Dokumentasi Multi-Tenancy
COMMENT ON TABLE public.tenants IS 'Tabel registrasi tenant / rumah sakit / instansi.';
COMMENT ON COLUMN public.employees.tenant_id IS 'ID tenant / rumah sakit pemilik data karyawan.';
