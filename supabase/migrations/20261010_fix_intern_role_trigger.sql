-- ==============================================================================
-- FIX: Preserve 'intern' and 'ceo' roles in trigger and profiles table
-- ==============================================================================

-- 1. Ensure public.profiles table check constraints allow 'intern' and 'ceo'
ALTER TABLE IF EXISTS public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE IF EXISTS public.profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('ceo', 'admin', 'member', 'intern'));

-- 2. Update handle_new_user trigger to preserve 'intern' and 'ceo' roles
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
  v_designation TEXT;
  v_invited_role TEXT;
BEGIN
  -- Check if user has an existing invitation with a role
  SELECT role INTO v_invited_role 
  FROM public.invitations 
  WHERE lower(email) = lower(new.email) 
  ORDER BY created_at DESC 
  LIMIT 1;

  -- Determine role with priority: user_metadata -> invitation -> default 'member'
  v_role := COALESCE(
    NULLIF(trim(lower(new.raw_user_meta_data->>'role')), ''),
    NULLIF(trim(lower(v_invited_role)), ''),
    'member'
  );

  IF v_role NOT IN ('ceo', 'admin', 'member', 'intern') THEN
    v_role := 'member';
  END IF;

  v_name := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
    split_part(new.email, '@', 1)
  );

  -- Determine appropriate designation and department based on role
  IF v_role = 'ceo' THEN
    v_department := 'Executive';
    v_designation := 'Chief Executive Officer';
  ELSIF v_role = 'admin' THEN
    v_department := 'Administration';
    v_designation := 'System Administrator';
  ELSIF v_role = 'intern' THEN
    v_department := 'Internship';
    v_designation := 'Intern';
  ELSE
    v_department := COALESCE(NULLIF(trim(new.raw_user_meta_data->>'department'), ''), 'Development');
    v_designation := 'Team Member';
  END IF;

  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role, 
    department, 
    designation, 
    status,
    updated_at
  )
  VALUES (
    new.id,
    lower(new.email),
    v_name,
    v_role,
    v_department,
    v_designation,
    'active',
    timezone('utc'::text, now())
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    id = EXCLUDED.id,
    role = CASE 
      WHEN public.profiles.role IS NULL OR public.profiles.role = 'member' 
      THEN EXCLUDED.role 
      ELSE public.profiles.role 
    END,
    updated_at = timezone('utc'::text, now());

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
