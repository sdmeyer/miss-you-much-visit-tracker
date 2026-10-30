-- Miss You Much Ministry: run this whole file in Supabase > SQL Editor.
-- Before running, change YOUR_EMAIL@example.com at the bottom.

create extension if not exists pgcrypto;

-- Tables ---------------------------------------------------------------
create table if not exists admins (
  email text primary key check (email = lower(email)),
  created_at timestamptz default now()
);

create table if not exists volunteers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz default now()
);
create table if not exists volunteer_details (
  volunteer_id uuid primary key references volunteers(id) on delete cascade,
  email text, phone text, comments text
);

create table if not exists people (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz default now()
);
create table if not exists person_details (
  person_id uuid primary key references people(id) on delete cascade,
  address text, email text, phone text, comments text
);

-- Names are copied onto each visit so history survives if someone is removed.
create table if not exists visits (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid, volunteer_name text not null,
  person_id uuid, person_name text not null,
  visit_date date not null,
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz default now()
);

-- Admin check: your login email must be listed in the admins table.
-- Supabase verifies email ownership through the magic link.
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where email = lower(auth.jwt() ->> 'email'));
$$;

-- Row Level Security -----------------------------------------------------
alter table admins enable row level security;
alter table volunteers enable row level security;
alter table volunteer_details enable row level security;
alter table people enable row level security;
alter table person_details enable row level security;
alter table visits enable row level security;

-- Admins: only admins can see or add; they cannot remove themselves.
create policy admins_select on admins for select using (is_admin());
create policy admins_insert on admins for insert with check (is_admin());
create policy admins_delete on admins for delete
  using (is_admin() and email <> lower(auth.jwt() ->> 'email'));

-- Names are readable by anyone (needed for the booking dropdowns); only admins edit.
create policy vol_read on volunteers for select using (true);
create policy vol_write on volunteers for all using (is_admin()) with check (is_admin());
create policy ppl_read on people for select using (true);
create policy ppl_write on people for all using (is_admin()) with check (is_admin());

-- Contact details and addresses: admins only.
create policy vold_all on volunteer_details for all using (is_admin()) with check (is_admin());
create policy pd_all on person_details for all using (is_admin()) with check (is_admin());

-- Visits: anyone can book one; only admins can read, edit or delete the list.
-- (To let everyone see the dashboard, add:
--  create policy visits_public_read on visits for select using (true);)
create policy visits_insert on visits for insert with check (true);
create policy visits_admin on visits for all using (is_admin()) with check (is_admin());

-- First admin ---------------------------------------------------------------
insert into admins (email) values (lower('seneca.meyer@gmail.com')) on conflict do nothing;
