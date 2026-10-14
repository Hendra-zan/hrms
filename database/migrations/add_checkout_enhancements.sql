-- Migration: Add Check-Out Enhancements Columns to public.attendance
-- Date: 2026-08-05

ALTER TABLE public.attendance 
  ADD COLUMN IF NOT EXISTS check_out_latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS check_out_longitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS check_out_location TEXT,
  ADD COLUMN IF NOT EXISTS early_leave_reason TEXT,
  ADD COLUMN IF NOT EXISTS daily_work_log TEXT,
  ADD COLUMN IF NOT EXISTS shift_handover_confirmed BOOLEAN DEFAULT false;

-- Create indexes for check-out location tracking
CREATE INDEX IF NOT EXISTS idx_attendance_checkout_location ON public.attendance (check_out_latitude, check_out_longitude);
