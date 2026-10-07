-- ==============================================================================
-- CEOVA INVITATIONS SCHEMA & HARDENED RLS POLICIES
-- ==============================================================================

create table if not exists public.invitations (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  role text not null check (role in ('admin', 'head', 'member', 'intern')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.invitations enable row level security;

-- Drop insecure legacy policies
drop policy if exists "Anyone can read invitations" on public.invitations;
drop policy if exists "Authenticated users can insert invitations" on public.invitations;
drop policy if exists "Anyone can delete invitations" on public.invitations;
drop policy if exists "Admins can manage invitations" on public.invitations;
drop policy if exists "Admins have full access to invitations" on public.invitations;
drop policy if exists "Allow reading invitation for activation" on public.invitations;
drop policy if exists "Allow deleting claimed invitation" on public.invitations;

-- 1. Admins have complete read/write/delete access to all invitations
create policy "Admins have full access to invitations"
  on public.invitations
  for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 2. Allow reading invitation for account activation
create policy "Allow reading invitation for activation"
  on public.invitations
  for select
  using (true);

-- 3. Only admins or the authenticated owner of the email can delete their invitation
create policy "Allow deleting claimed invitation"
  on public.invitations
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
    or lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
