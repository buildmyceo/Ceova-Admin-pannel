-- Migration: Task Submission Grace Window & Mandatory Retry Timer
-- Adds submitted_at column to public.tasks if not already present

ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Ensure review feedback columns exist
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS review_feedback TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by_id TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by_name TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
