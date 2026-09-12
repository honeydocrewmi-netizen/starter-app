create extension if not exists pg_net with schema extensions;

-- Store NOTIFICATION_WEBHOOK_SECRET in Edge Function Secrets and the same value
-- in Vault under notification_webhook_secret before testing notifications.
create or replace function public.notify_new_submission()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  webhook_secret text;
begin
  select decrypted_secret into webhook_secret
    from vault.decrypted_secrets where name = 'notification_webhook_secret' limit 1;
  if webhook_secret is null then
    raise warning 'Submission saved; notification webhook secret is not configured';
    return new;
  end if;
  perform net.http_post(
    url := 'https://cqvsrrbsmvuecwjyggud.supabase.co/functions/v1/notify-submission',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', webhook_secret),
    body := jsonb_build_object('type', 'INSERT', 'schema', 'public', 'table', 'submissions', 'record', to_jsonb(new)),
    timeout_milliseconds := 20000
  );
  return new;
exception when others then
  -- A notification outage must never discard a customer's request.
  raise warning 'Submission saved; notification could not be queued';
  return new;
end;
$$;
revoke all on function public.notify_new_submission() from public, anon, authenticated;
drop trigger if exists notify_new_submission on public.submissions;
create trigger notify_new_submission after insert on public.submissions
for each row execute function public.notify_new_submission();
