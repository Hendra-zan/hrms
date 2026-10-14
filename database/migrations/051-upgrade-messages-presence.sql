-- Upgrade messages table for file attachment support
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS file_type TEXT;

-- Upgrade employees table for active presence tracking
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT now();
