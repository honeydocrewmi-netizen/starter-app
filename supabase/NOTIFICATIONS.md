# Owner project and quote notifications

Project: cqvsrrbsmvuecwjyggud
Recipient: honeydocrewmi@gmail.com

The site saves submissions directly to the owner's database. An insert trigger
queues a request to notify-submission, which authenticates a private webhook
secret and emails the owner through Resend. Public visitors cannot read stored
submissions or invoke the email sender without the secret. Customer email, when
valid, becomes Reply-To; it never controls the notification recipient.

## Deployment

1. Sign into the owner account using `/opt/homebrew/bin/supabase login`.
2. Link: `supabase link --project-ref cqvsrrbsmvuecwjyggud`.
3. Set function secrets using the ignored local file:
   `supabase secrets set --env-file supabase/.env.notifications.local --project-ref cqvsrrbsmvuecwjyggud`.
4. Store the same NOTIFICATION_WEBHOOK_SECRET value in Supabase Vault with name
   `notification_webhook_secret`. Never commit either secret to Git.
5. Deploy: `supabase functions deploy notify-submission --project-ref cqvsrrbsmvuecwjyggud --use-api`.
6. Apply migrations: `supabase db push` (review target and migration list first).
7. Deploy the site through its existing GitHub Pages workflow.
8. Submit a clearly labeled test request and confirm both its saved database row
   and arrival of the notification in the owner's inbox.

The deploy workflow uses supabase/config.json rather than old repository
variables, which could otherwise send customer requests to the previous project.

## Email operation

NOTIFICATION_FROM currently uses HoneyDo Crew <onboarding@resend.dev>, Resend's
test sender. It successfully accepted a setup email for the owner on 2026-09-12.
For production branding, verify honeydocrewservices.com in Resend and change
NOTIFICATION_FROM to a sender on the verified domain.

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

## Verification on 2026-09-12

Both migrations and notify-submission were deployed to the owner project. A
public-key test insert returned 201 and saved one clearly labeled setup request.
The database webhook returned 200 with sent:true. Public reads and unauthenticated
email calls both returned 401. Five handler tests, ESLint, and the static production
build passed. Website publication is tracked separately through GitHub Actions.
