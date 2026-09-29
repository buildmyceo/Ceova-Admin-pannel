-- ==============================================================================
-- CEOVA ADMIN, HEADS & MEMBERS PORTAL SCHEMA
-- PostgreSQL Schema for Supabase (Safe & Idempotent)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Profiles Table (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT 'User',
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    department TEXT DEFAULT 'General',
    designation TEXT DEFAULT 'Team Member',
    phone TEXT,
    status TEXT DEFAULT 'active',
    bio TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure all required columns exist even if profiles table pre-existed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT NOT NULL DEFAULT 'User';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'General';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation TEXT DEFAULT 'Team Member';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 3. Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    head_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    color TEXT DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    priority TEXT DEFAULT 'normal',
    target_role TEXT DEFAULT 'all',
    target_department TEXT DEFAULT 'all',
    pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tasks & Deliverables Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    department TEXT DEFAULT 'General',
    priority TEXT DEFAULT 'normal',
    status TEXT DEFAULT 'todo',
    due_date DATE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Member Requests / Helpdesk Table
CREATE TABLE IF NOT EXISTS public.member_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Audit & Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT,
    role TEXT,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- To avoid recursion, helper functions use SECURITY DEFINER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_head_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'head')
  );
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if already defined to avoid duplicate errors
DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow user insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Allow read departments" ON public.departments;
DROP POLICY IF EXISTS "Allow admin manage departments" ON public.departments;

DROP POLICY IF EXISTS "Allow read announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow head and admin insert announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow admin update announcements" ON public.announcements;
DROP POLICY IF EXISTS "Allow admin delete announcements" ON public.announcements;

DROP POLICY IF EXISTS "Allow authenticated view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow heads and admins manage tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow assignees or leads to update tasks" ON public.tasks;

DROP POLICY IF EXISTS "Allow user view own requests or leads view all" ON public.member_requests;
DROP POLICY IF EXISTS "Allow user create own requests" ON public.member_requests;
DROP POLICY IF EXISTS "Allow leads to review requests" ON public.member_requests;

DROP POLICY IF EXISTS "Allow read logs for leads and admins" ON public.activity_logs;
DROP POLICY IF EXISTS "Allow insert logs" ON public.activity_logs;

-- Profiles Policies
CREATE POLICY "Allow authenticated read profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow users update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "Allow admin update any profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Allow admin delete profiles"
ON public.profiles FOR DELETE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Allow user insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = (SELECT auth.uid()));

-- Departments Policies
CREATE POLICY "Allow read departments"
ON public.departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin manage departments"
ON public.departments FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Announcements Policies
CREATE POLICY "Allow read announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow head and admin insert announcements"
ON public.announcements FOR INSERT
TO authenticated
WITH CHECK (public.is_head_or_admin());

CREATE POLICY "Allow admin update announcements"
ON public.announcements FOR UPDATE
TO authenticated
USING (public.is_admin() OR author_id = (SELECT auth.uid()))
WITH CHECK (public.is_admin() OR author_id = (SELECT auth.uid()));

CREATE POLICY "Allow admin delete announcements"
ON public.announcements FOR DELETE
TO authenticated
USING (public.is_admin() OR author_id = (SELECT auth.uid()));

-- Tasks Policies
CREATE POLICY "Allow authenticated view tasks"
ON public.tasks FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow heads and admins manage tasks"
ON public.tasks FOR INSERT
TO authenticated
WITH CHECK (public.is_head_or_admin());

CREATE POLICY "Allow assignees or leads to update tasks"
ON public.tasks FOR UPDATE
TO authenticated
USING (
  assigned_to = (SELECT auth.uid()) 
  OR public.is_head_or_admin()
)
WITH CHECK (
  assigned_to = (SELECT auth.uid()) 
  OR public.is_head_or_admin()
);

-- Member Requests Policies
CREATE POLICY "Allow user view own requests or leads view all"
ON public.member_requests FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR public.is_head_or_admin()
);

CREATE POLICY "Allow user create own requests"
ON public.member_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Allow leads to review requests"
ON public.member_requests FOR UPDATE
TO authenticated
USING (public.is_head_or_admin())
WITH CHECK (public.is_head_or_admin());

-- Activity Logs Policies
CREATE POLICY "Allow read logs for leads and admins"
ON public.activity_logs FOR SELECT
TO authenticated
USING (public.is_head_or_admin());

CREATE POLICY "Allow insert logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER (ON SUPABASE AUTH SIGNUP)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_name TEXT;
  v_department TEXT;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'member');
  IF v_role NOT IN ('admin', 'head', 'member') THEN
    v_role := 'member';
  END IF;

  v_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  v_department := COALESCE(new.raw_user_meta_data->>'department', 'Engineering');

  INSERT INTO public.profiles (id, email, full_name, role, department, designation, status)
  VALUES (
    new.id,
    new.email,
    v_name,
    v_role,
    v_department,
    CASE 
      WHEN v_role = 'admin' THEN 'System Administrator'
      WHEN v_role = 'head' THEN 'Department Head'
      ELSE 'Associate Specialist'
    END,
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = timezone('utc'::text, now());

  RETURN new;
END;
$$;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- SEED INITIAL DEPARTMENTS
-- ==============================================================================
INSERT INTO public.departments (name, description, color)
VALUES
  ('Engineering', 'Core software development, web architecture, and infrastructure.', '#3b82f6'),
  ('AI & Machine Learning', 'Voice AI, vision models, autonomous agents, and inference.', '#8b5cf6'),
  ('Product & Design', 'UI/UX design systems, user journeys, and feature specifications.', '#ec4899'),
  ('Operations & HR', 'Talent acquisition, operations workflow, and member engagement.', '#10b981'),
  ('Marketing & Growth', 'Brand distribution, partnerships, campaigns, and community.', '#f59e0b')
ON CONFLICT (name) DO NOTHING;
