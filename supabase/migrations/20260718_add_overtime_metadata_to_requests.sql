-- Add overtime_metadata column to requests table
ALTER TABLE public.requests ADD COLUMN IF NOT EXISTS overtime_metadata JSONB;
