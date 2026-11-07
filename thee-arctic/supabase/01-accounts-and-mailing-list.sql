create extension if not exists citext;

-- One profile per customer account, created automatically on sign-up
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  first_name text,
  last_name text,
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated using (auth.uid() = id);
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, first_name, last_name, marketing_opt_in)
  values (new.id, new.email,
          new.raw_user_meta_data->>'first_name',
          new.raw_user_meta_data->>'last_name',
          coalesce((new.raw_user_meta_data->>'marketing_opt_in')::boolean, false));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Mailing list: anyone may add an email; nobody can read the list from the site
create table if not exists public.subscribers (
  id bigint generated always as identity primary key,
  email citext not null unique check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  source text check (length(source) <= 40),
  created_at timestamptz not null default now()
);
alter table public.subscribers enable row level security;
drop policy if exists "anyone can subscribe" on public.subscribers;
create policy "anyone can subscribe" on public.subscribers for insert to anon, authenticated with check (true);
revoke all on public.subscribers from anon, authenticated;
grant insert (email, source) on public.subscribers to anon, authenticated;
