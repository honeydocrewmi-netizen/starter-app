# Supabase project and quote notifications

Project: azxzulkusijmtjlacraf (maintainer's Supabase account)
Sender: HoneyDo Crew <quotes@honeydocrewservices.com> (maintainer's Resend account)
Recipient: honeydocrewmi@gmail.com

The Supabase project, Resend account and DNS are all managed by the maintainer,
not the business owner's accounts. The owner-account project
cqvsrrbsmvuecwjyggud set up on 2026-09-12 stopped resolving by 2026-10-13; requests stored there are not in this project.

The site saves submissions directly to the database. An insert trigger
queues a request to notify-submission, which authenticates a private webhook
secret and emails the owner through Resend. Public visitors cannot read stored
submissions or invoke the email sender without the secret. Customer email, when
valid, becomes Reply-To; it never controls the notification recipient.

## Deployment

1. Sign into the maintainer's Supabase account using `supabase login`.
2. Link: `supabase link --project-ref azxzulkusijmtjlacraf`.
3. Set function secrets using the ignored local file:
   `supabase secrets set --env-file supabase/.env.notifications.local --project-ref azxzulkusijmtjlacraf`.
4. Store the same NOTIFICATION_WEBHOOK_SECRET value in Supabase Vault with name
   `notification_webhook_secret`. Never commit either secret to Git.
5. Deploy: `supabase functions deploy notify-submission --project-ref azxzulkusijmtjlacraf --use-api`.
6. Apply migrations: `supabase db push` (review target and migration list first),
   or run them with `supabase db query --linked --project-ref azxzulkusijmtjlacraf -f <file>`.
7. Deploy the site through its existing GitHub Pages workflow.
8. Submit a clearly labeled test request and confirm both its saved database row
   and arrival of the notification in the owner's inbox.

The deploy workflow uses supabase/config.json rather than old repository
variables, which could otherwise send customer requests to the previous project.

## Email operation

NOTIFICATION_FROM is HoneyDo Crew <quotes@honeydocrewservices.com>. The domain is
verified in Resend through Squarespace DNS records (resend._domainkey TXT, send
and rsend CNAMEs, root MX); removing them stops all notification email. The
Resend API key is send-only, so delivery status is checked in the Resend
dashboard rather than through the API.

Notifications are asynchronous: provider failure does not discard the saved
request. This initial implementation does not automatically retry failed
notifications. Check Edge Function logs and net._http_response for errors;
resend the same webhook event if necessary. Resend's idempotency key reduces
short-term duplicate sends for the same submission. The database remains the
source of truth; do not rely on the inbox as the only record.

The existing schema specifies 90-day database retention. The initial migration
contains no cleanup DELETE; manage retention separately. Emails have their own
inbox retention.

## Local checks

node --test scripts/notification.test.mjs
npm run lint
npm run build

## Verification on 2026-10-13

Function, secrets, Vault secret and trigger set up on azxzulkusijmtjlacraf. A
labeled TEST insert returned 201; the function rejects calls without the secret
(401).

## Verification on 2026-09-12 (lost owner project)

Both migrations and notify-submission were deployed to the owner project. A
public-key test insert returned 201 and saved one clearly labeled setup request.
The database webhook returned 200 with sent:true. Public reads and unauthenticated
email calls both returned 401. Five handler tests, ESLint, and the static production
build passed. Website publication is tracked separately through GitHub Actions.
