-- Allow user_id to accept text or 'all' for broadcasts
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE TEXT USING user_id::text;
