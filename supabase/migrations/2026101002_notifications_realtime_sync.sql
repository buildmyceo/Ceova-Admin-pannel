-- ==============================================================================
-- NOTIFICATIONS TABLE FULL SYNC & PERMISSIVE RLS
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'message',
    read BOOLEAN DEFAULT false,
    sender_id TEXT,
    sender_name TEXT,
    sender_role TEXT,
    sender_avatar TEXT,
    target_type TEXT DEFAULT 'members',
    recipient_ids TEXT[] DEFAULT '{}',
    recipient_names TEXT[] DEFAULT '{}',
    link TEXT,
    photos JSONB DEFAULT '[]'::jsonb,
    files JSONB DEFAULT '[]'::jsonb,
    read_by_ids TEXT[] DEFAULT '{}',
    read_by_names TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist in public.notifications
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Notification';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT NOT NULL DEFAULT '';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'message';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_role TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS sender_avatar TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'members';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS recipient_names TEXT[] DEFAULT '{}';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_by_ids TEXT[] DEFAULT '{}';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read_by_names TEXT[] DEFAULT '{}';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- Enable RLS and permissive policies for public API access
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public access notifications" ON public.notifications;
CREATE POLICY "Public access notifications" ON public.notifications FOR ALL TO public USING (true) WITH CHECK (true);

GRANT ALL ON public.notifications TO anon, authenticated, service_role;

-- Enable Realtime publication for instant cross-device delivery
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
END $$;
