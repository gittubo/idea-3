create table if not exists public.messages (
  id bigint generated always as identity primary key,
  name text not null check (length(btrim(name)) between 1 and 100),
  email text not null check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(email) <= 254),
  topic text check (length(topic) <= 40),
  order_number text check (length(order_number) <= 40),
  message text not null check (length(btrim(message)) between 1 and 5000),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
drop policy if exists "anyone can send a message" on public.messages;
create policy "anyone can send a message" on public.messages for insert to anon, authenticated with check (true);
revoke all on public.messages from anon, authenticated;
grant insert (name, email, topic, order_number, message) on public.messages to anon, authenticated;
