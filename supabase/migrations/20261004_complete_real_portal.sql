-- ==============================================================================
-- CEOVA TEAM OS - COMPLETE PRODUCTION DATABASE MIGRATION
-- Safe & Idempotent Schema for Supabase
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE FIX & EXPANSION
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT 'Ceova Member',
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    department TEXT DEFAULT 'Development',
    designation TEXT DEFAULT 'Team Member',
    phone TEXT,
    status TEXT DEFAULT 'active',
    bio TEXT,
    skills TEXT[] DEFAULT '{}',
    reporting_to TEXT,
    supervisor TEXT,
    current_project TEXT,
    weekly_progress NUMERIC DEFAULT 0,
    attendance_rate NUMERIC DEFAULT 100,
    supervisor_feedback TEXT,
    permissions TEXT[] DEFAULT '{"manage_tasks"}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT 'Ceova Member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Development';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Team Member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reporting_to TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS supervisor TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_project TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS weekly_progress NUMERIC DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS attendance_rate NUMERIC DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS supervisor_feedback TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{"manage_tasks"}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.departments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL UNIQUE,
    code TEXT,
    description TEXT,
    c_suite_leader TEXT,
    head_id TEXT,
    head_name TEXT,
    color TEXT DEFAULT '#6366f1',
    member_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.projects (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name TEXT NOT NULL,
    code TEXT,
    description TEXT,
    owner_name TEXT,
    owner_role TEXT,
    department TEXT,
    status TEXT DEFAULT 'planning',
    progress INT DEFAULT 0,
    deadline DATE,
    members JSONB DEFAULT '[]'::jsonb,
    milestones JSONB DEFAULT '[]'::jsonb,
    risks TEXT[] DEFAULT '{}',
    tasks_count JSONB DEFAULT '{"total":0,"completed":0}'::jsonb,
    files_count INT DEFAULT 0,
    chat_channel_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to_id TEXT,
    assigned_to_name TEXT,
    assigned_by_id TEXT,
    assigned_by_name TEXT,
    department TEXT DEFAULT 'Development',
    project_name TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'todo',
    due_date DATE,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CHANNELS TABLE
CREATE TABLE IF NOT EXISTS public.channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    department TEXT,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    channel_id TEXT NOT NULL,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    sender_avatar TEXT,
    text TEXT NOT NULL,
    attachment JSONB,
    suggested_task JSONB,
    suggested_approval JSONB,
    pinned BOOLEAN DEFAULT false,
    reactions JSONB DEFAULT '[]'::jsonb,
    timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. FINANCIALS TABLE
CREATE TABLE IF NOT EXISTS public.financials (
    id TEXT PRIMARY KEY DEFAULT 'primary_metrics',
    cash_balance NUMERIC NOT NULL DEFAULT 42000000,
    monthly_revenue NUMERIC NOT NULL DEFAULT 2450000,
    monthly_expenses NUMERIC NOT NULL DEFAULT 3280000,
    monthly_burn NUMERIC NOT NULL DEFAULT 830000,
    runway_months NUMERIC NOT NULL DEFAULT 18.5,
    pending_payments_total NUMERIC NOT NULL DEFAULT 425000,
    pending_reimbursements_total NUMERIC NOT NULL DEFAULT 68000,
    total_funding NUMERIC NOT NULL DEFAULT 125000000,
    investors JSONB DEFAULT '[]'::jsonb,
    grants JSONB DEFAULT '[]'::jsonb,
    approvals JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. STRATEGIC DECISIONS TABLE
CREATE TABLE IF NOT EXISTS public.strategic_decisions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT,
    status TEXT DEFAULT 'pending',
    owner TEXT,
    impact TEXT DEFAULT 'Medium',
    deadline DATE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. ANNOUNCEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.announcements (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id TEXT,
    author_name TEXT,
    author_role TEXT,
    priority TEXT DEFAULT 'normal',
    target_role TEXT DEFAULT 'all',
    target_department TEXT DEFAULT 'all',
    pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. MEMBER REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.member_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    amount TEXT,
    status TEXT DEFAULT 'pending',
    reviewed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. ACTIVITY LOGS TABLE
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT,
    user_name TEXT,
    role TEXT,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. WAITLIST REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.waitlist_requests (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    requested_role TEXT NOT NULL DEFAULT 'member',
    department TEXT NOT NULL DEFAULT 'Development',
    phone TEXT,
    reason TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reviewed_at TIMESTAMPTZ,
    reviewed_by TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_requests ENABLE ROW LEVEL SECURITY;

-- Drop any previous conflicting policies
DROP POLICY IF EXISTS "Allow read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public access departments" ON public.departments;
DROP POLICY IF EXISTS "Public access projects" ON public.projects;
DROP POLICY IF EXISTS "Public access tasks" ON public.tasks;
DROP POLICY IF EXISTS "Public access channels" ON public.channels;
DROP POLICY IF EXISTS "Public access chat_messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Public access financials" ON public.financials;
DROP POLICY IF EXISTS "Public access strategic_decisions" ON public.strategic_decisions;
DROP POLICY IF EXISTS "Public access announcements" ON public.announcements;
DROP POLICY IF EXISTS "Public access member_requests" ON public.member_requests;
DROP POLICY IF EXISTS "Public access activity_logs" ON public.activity_logs;
DROP POLICY IF EXISTS "Public access waitlist_requests" ON public.waitlist_requests;

-- Create permissive RLS policies for client API access
CREATE POLICY "Public access profiles" ON public.profiles FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access departments" ON public.departments FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access projects" ON public.projects FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access tasks" ON public.tasks FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access channels" ON public.channels FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access chat_messages" ON public.chat_messages FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access financials" ON public.financials FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access strategic_decisions" ON public.strategic_decisions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access announcements" ON public.announcements FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access member_requests" ON public.member_requests FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access activity_logs" ON public.activity_logs FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Public access waitlist_requests" ON public.waitlist_requests FOR ALL TO public USING (true) WITH CHECK (true);

-- Grant privileges to anon, authenticated, and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Enable Realtime on core tables
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks, public.chat_messages, public.waitlist_requests, public.member_requests, public.strategic_decisions, public.announcements;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- Already added
  END;
END $$;
