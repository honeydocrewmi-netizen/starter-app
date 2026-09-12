// Only the database webhook knows this secret; the browser cannot send emails.
export function createHandler(env, send = fetch) {
  return async (request) => {
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
    const secret = env('NOTIFICATION_WEBHOOK_SECRET');
    if (!secret) return new Response('Not configured', { status: 503 });
    if (request.headers.get('x-webhook-secret') !== secret) return new Response('Unauthorized', { status: 401 });
    const apiKey = env('RESEND_API_KEY');
    const from = env('NOTIFICATION_FROM');
    if (!apiKey || !from) return new Response('Email not configured', { status: 503 });
    let payload;
    try { payload = await request.json(); } catch { return new Response('Invalid JSON', { status: 400 }); }
    const row = payload?.record;
    if (payload?.type !== 'INSERT' || payload?.schema !== 'public' || payload?.table !== 'submissions' ||
        !row || typeof row.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(row.id) ||
        typeof row.name !== 'string' || typeof row.phone !== 'string' || !Array.isArray(row.services)) {
      return new Response('Invalid submission event', { status: 400 });
    }
    const labels = { gutters: 'Gutters', roof: 'Roof', yard: 'Yard', asap: 'As soon as possible',
      'this-month': 'This month', 'just-pricing': 'Just checking prices', none: 'No trees',
      'a-few': 'A few trees', 'a-lot': 'A lot of trees' };
    const display = value => value == null || value === '' ? 'Not provided' : String(value);
    const fields = [ ['Name', row.name], ['Phone', row.phone], ['Email', row.email],
      ['Address', row.address], ['Services', row.services.map(s => labels[s] || s).join(', ')],
      ['Stories', row.stories], ['Trees', labels[row.trees] || row.trees],
      ['Timing', labels[row.urgency] || row.urgency], ['Notes', row.notes],
      ['Source', row.source], ['Submitted', row.created_at], ['Request ID', row.id] ];
    const email = {
      from, to: ['honeydocrewmi@gmail.com'], subject: 'New HoneyDo Crew quote request',
      text: 'A new request has been saved in Supabase.\n\n' + fields.map(([label,value]) => `${label}: ${display(value)}`).join('\n\n'),
    };
    if (typeof row.email === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) email.reply_to = row.email;
    try {
      const response = await send('https://api.resend.com/emails', {
        method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json',
          'Idempotency-Key': `submission-${row.id}` }, body: JSON.stringify(email),
        signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        console.error('Notification provider rejected request', response.status);
        return new Response('Email delivery failed', { status: 502 });
      }
      return Response.json({ sent: true });
    } catch {
      console.error('Notification provider unavailable');
      return new Response('Email delivery failed', { status: 502 });
    }
  };
}
