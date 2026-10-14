-- ============================================================
-- Migration: Create Shift Swap Requests Table & Triggers
-- Tujuan   : Mendukung pengajuan tukar shift antar karyawan dengan persetujuan berjenjang
--            (Rekan Kerja -> Kepala Unit -> Automatis Atomic Swap)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.shift_swap_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Karyawan Pemohon & Jadwal yang ingin dilepas/ditukar
  requester_employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  requester_schedule_id TEXT NOT NULL REFERENCES public.employee_schedules(id) ON DELETE CASCADE,
  
  -- Karyawan Rekan Kerja & Jadwal target yang diajak bertukar
  target_employee_id TEXT NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  target_schedule_id TEXT NOT NULL REFERENCES public.employee_schedules(id) ON DELETE CASCADE,
  
  reason TEXT NOT NULL,
  
  -- Tier 1: Persetujuan Rekan Kerja yang diajak tukar
  peer_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (peer_status IN ('pending', 'approved', 'rejected')),
  peer_responded_at TIMESTAMPTZ,
  
  -- Tier 2: Persetujuan Kepala Unit / Supervisor
  unit_approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (unit_approval_status IN ('pending', 'approved', 'rejected')),
  unit_approved_by TEXT REFERENCES public.employees(id),
  unit_approved_at TIMESTAMPTZ,
  unit_approval_note TEXT,
  
  -- Status Keseluruhan Alur Pengajuan
  overall_status VARCHAR(30) NOT NULL DEFAULT 'pending_peer' CHECK (overall_status IN ('pending_peer', 'pending_unit', 'approved', 'rejected', 'cancelled')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indeks Kinerja
CREATE INDEX IF NOT EXISTS idx_shift_swap_requester ON public.shift_swap_requests(requester_employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_target ON public.shift_swap_requests(target_employee_id);
CREATE INDEX IF NOT EXISTS idx_shift_swap_overall_status ON public.shift_swap_requests(overall_status);
CREATE INDEX IF NOT EXISTS idx_shift_swap_tenant ON public.shift_swap_requests(tenant_id);

-- Enforce RLS
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for shift_swap_requests" ON public.shift_swap_requests
  FOR ALL USING (true) WITH CHECK (true);

COMMENT ON TABLE public.shift_swap_requests IS 'Tabel pengajuan tukar shift antar karyawan berjenjang (Rekan Kerja -> Kepala Unit).';
