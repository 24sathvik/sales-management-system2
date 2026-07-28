-- Add deleted_at column for soft-deletes
ALTER TABLE public.quotations 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
