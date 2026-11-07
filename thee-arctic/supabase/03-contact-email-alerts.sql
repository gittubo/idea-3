create extension if not exists pg_net;

-- Emails the shop owner about each new contact message, via Resend.
-- Needs two Vault secrets: resend_api_key and alert_email. Without them it does nothing.
-- Never blocks the message from saving, and stops after 50 alerts a day so spam can't use up the free quota.
create or replace function public.notify_new_message() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  api_key text;
  dest text;
  sent_today int;
  body_text text;
begin
  select decrypted_secret into api_key from vault.decrypted_secrets where name = 'resend_api_key' limit 1;
  select decrypted_secret into dest    from vault.decrypted_secrets where name = 'alert_email'    limit 1;
  -- Skip until real values replace the placeholders (Resend keys start with re_)
  if coalesce(btrim(api_key), '') not like 're\_%' or coalesce(btrim(dest), '') !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return new;
  end if;

  select count(*) into sent_today from public.messages where created_at > now() - interval '1 day';
  if sent_today > 50 then
    return new;
  end if;

  body_text := 'New message from the THEE ARCTIC contact form' || E'\n\n'
    || 'Name: '  || new.name  || E'\n'
    || 'Email: ' || new.email || E'\n'
    || 'Topic: ' || coalesce(new.topic, '-') || E'\n'
    || 'Order number: ' || coalesce(new.order_number, '-') || E'\n\n'
    || new.message || E'\n\n'
    || '-- ' || E'\n'
    || 'Reply to this email to answer ' || new.name || ' directly.' || E'\n'
    || 'All messages: Supabase > thee-arctic > Table Editor > messages';

  perform net.http_post(
    url     := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || btrim(api_key), 'Content-Type', 'application/json'),
    body    := jsonb_build_object(
      'from', 'THEE ARCTIC Website <onboarding@resend.dev>',
      'to', jsonb_build_array(btrim(dest)),
      'reply_to', new.email,
      'subject', 'New message: ' || coalesce(new.topic, 'General question') || ' from ' || left(new.name, 60),
      'text', body_text
    )
  );
  return new;
exception when others then
  raise warning 'contact alert not sent: %', sqlerrm;
  return new;
end $$;

revoke all on function public.notify_new_message() from public, anon, authenticated;

drop trigger if exists on_new_message on public.messages;
create trigger on_new_message after insert on public.messages
  for each row execute function public.notify_new_message();
