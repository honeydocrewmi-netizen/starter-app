import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../supabase/functions/notify-submission/handler.js';
const values = { NOTIFICATION_WEBHOOK_SECRET: 'test-secret', RESEND_API_KEY: 'test-api-key', NOTIFICATION_FROM: 'HoneyDo Crew <onboarding@resend.dev>' };
const payload = { type: 'INSERT', schema: 'public', table: 'submissions', record: {
  id: '12345678-1234-1234-1234-123456789012', name: '<Customer>', phone: '734-555-0100',
  address: 'Test address', services: ['gutters'], email: 'customer@example.com', notes: 'Please call first',
} };
const request = (secret = 'test-secret', body = payload) => new Request('https://example.com', {
  method: 'POST', headers: { 'x-webhook-secret': secret }, body: JSON.stringify(body),
});
test('rejects public callers before sending email', async () => {
  const handler = createHandler(k => values[k], () => { throw Error('Must not send'); });
  assert.equal((await handler(request('wrong'))).status, 401);
});
test('emails only the owner with the submission and stable deduplication key', async () => {
  let sent;
  const handler = createHandler(k => values[k], async (url, options) => { sent = { url, ...options }; return Response.json({ id: 'email-id' }); });
  assert.equal((await handler(request())).status, 200);
  const body = JSON.parse(sent.body);
  assert.deepEqual(body.to, ['honeydocrewmi@gmail.com']);
  assert.equal(body.reply_to, 'customer@example.com');
  assert.match(body.text, /Please call first/);
  assert.match(body.text, /Gutters/);
  assert.equal(sent.headers['Idempotency-Key'], `submission-${payload.record.id}`);
});
test('rejects unrelated events', async () => {
  const handler = createHandler(k => values[k], () => { throw Error('Must not send'); });
  assert.equal((await handler(request('test-secret', { ...payload, table: 'other' }))).status, 400);
});
test('reports provider failure rather than claiming delivery', async () => {
  const handler = createHandler(k => values[k], async () => new Response('', { status: 429 }));
  assert.equal((await handler(request())).status, 502);
});
test('fails closed when secrets are missing', async () => {
  const handler = createHandler(() => undefined, () => { throw Error('Must not send'); });
  assert.equal((await handler(request())).status, 503);
});
