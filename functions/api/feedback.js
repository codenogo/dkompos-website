const ALLOWED_TOPICS = new Map([
  ['bug', 'Bug report'],
  ['audio', 'Audio output or signal path'],
  ['library', 'Library, metadata, or scanning'],
  ['dj', 'DJ workflow'],
  ['audiobook', 'Audiobooks or long-form listening'],
  ['feature', 'Feature request'],
  ['general', 'General feedback'],
]);

const FALLBACK_EMAIL = 'hello@dkompos.com';

export async function onRequestPost({ request, env }) {
  const accept = request.headers.get('accept') || '';
  const wantsJson = accept.includes('application/json');

  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/x-www-form-urlencoded') && !contentType.includes('multipart/form-data')) {
      return respond({ ok: false, message: 'Use the feedback form to send a note.' }, 415, wantsJson);
    }

    const form = await request.formData();
    if (value(form, 'company')) {
      return respond({ ok: true, message: 'Received.' }, 200, wantsJson);
    }

    const feedback = normalizeFeedback(form, request);
    const validationError = validateFeedback(feedback);
    if (validationError) {
      return respond({ ok: false, message: validationError }, 400, wantsJson);
    }

    const result = await deliverFeedback(feedback, env);
    if (!result.ok) {
      return respond(
        {
          ok: false,
          message: result.message,
          fallbackEmail: FALLBACK_EMAIL,
        },
        result.status,
        wantsJson,
      );
    }

    return respond({ ok: true, message: 'Received. Thank you for helping shape Dkompos.' }, 200, wantsJson);
  } catch (error) {
    console.error('feedback_submit_failed', error);
    return respond(
      {
        ok: false,
        message: 'The feedback endpoint could not process that note.',
        fallbackEmail: FALLBACK_EMAIL,
      },
      500,
      wantsJson,
    );
  }
}

export function onRequestGet({ request }) {
  return Response.redirect(new URL('/contact.html', request.url).toString(), 303);
}

function normalizeFeedback(form, request) {
  const topic = value(form, 'topic') || 'general';
  const email = value(form, 'email');
  const context = value(form, 'context');
  const message = value(form, 'message');
  const source = value(form, 'source').slice(0, 80) || 'unknown';

  return {
    topic: ALLOWED_TOPICS.has(topic) ? topic : 'general',
    topicLabel: ALLOWED_TOPICS.get(topic) || ALLOWED_TOPICS.get('general'),
    email,
    context,
    message,
    source,
    submittedAt: new Date().toISOString(),
    referrer: request.headers.get('referer') || '',
    userAgent: request.headers.get('user-agent') || '',
  };
}

function validateFeedback(feedback) {
  if (feedback.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(feedback.email)) {
    return 'Enter a valid reply email, or leave the email field blank.';
  }
  if (feedback.message.length < 10) {
    return 'Write at least a short sentence so the note has enough context.';
  }
  if (feedback.message.length > 4000) {
    return 'Keep feedback under 4,000 characters.';
  }
  if (feedback.context.length > 500) {
    return 'Keep setup context under 500 characters.';
  }
  return null;
}

async function deliverFeedback(feedback, env) {
  if (env.FEEDBACK_EMAIL && typeof env.FEEDBACK_EMAIL.send === 'function') {
    return sendWithCloudflareEmail(feedback, env);
  }
  if (env.RESEND_API_KEY) {
    return sendWithResend(feedback, env);
  }
  if (env.FEEDBACK_WEBHOOK_URL) {
    return sendToWebhook(feedback, env);
  }
  return {
    ok: false,
    status: 503,
    message: 'The feedback inbox is not wired up yet.',
  };
}

async function sendWithCloudflareEmail(feedback, env) {
  const to = env.FEEDBACK_TO_EMAIL || FALLBACK_EMAIL;
  const from = env.FEEDBACK_FROM_EMAIL || 'feedback@dkompos.com';
  const subject = `[Dkompos feedback] ${feedback.topicLabel}`;
  const replyTo = feedback.email || undefined;

  try {
    await env.FEEDBACK_EMAIL.send({
      from,
      to,
      subject,
      text: buildEmailText(feedback),
      replyTo,
    });
    return { ok: true };
  } catch (error) {
    console.error('feedback_cloudflare_email_failed', error);
    return {
      ok: false,
      status: 502,
      message: 'The feedback inbox could not accept that note right now.',
    };
  }
}

async function sendWithResend(feedback, env) {
  const to = env.FEEDBACK_TO_EMAIL || FALLBACK_EMAIL;
  const from = env.FEEDBACK_FROM_EMAIL || 'Dkompos Feedback <feedback@dkompos.com>';
  const subject = `[Dkompos feedback] ${feedback.topicLabel}`;
  const payload = {
    from,
    to: [to],
    subject,
    text: buildEmailText(feedback),
  };

  if (feedback.email) {
    payload.reply_to = feedback.email;
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error('feedback_resend_failed', await response.text());
    return {
      ok: false,
      status: 502,
      message: 'The feedback inbox could not accept that note right now.',
    };
  }

  return { ok: true };
}

async function sendToWebhook(feedback, env) {
  const headers = { 'content-type': 'application/json' };
  if (env.FEEDBACK_WEBHOOK_TOKEN) {
    headers.authorization = `Bearer ${env.FEEDBACK_WEBHOOK_TOKEN}`;
  }

  const response = await fetch(env.FEEDBACK_WEBHOOK_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'dkompos.feedback',
      feedback,
      text: buildEmailText(feedback),
    }),
  });

  if (!response.ok) {
    console.error('feedback_webhook_failed', response.status, await response.text());
    return {
      ok: false,
      status: 502,
      message: 'The feedback inbox could not accept that note right now.',
    };
  }

  return { ok: true };
}

function buildEmailText(feedback) {
  return [
    `Kind: ${feedback.topicLabel}`,
    feedback.email ? `Reply-to: ${feedback.email}` : 'Reply-to: not provided',
    feedback.context ? `Setup: ${feedback.context}` : 'Setup: not provided',
    `Source: ${feedback.source}`,
    `Submitted: ${feedback.submittedAt}`,
    feedback.referrer ? `Referrer: ${feedback.referrer}` : '',
    feedback.userAgent ? `User agent: ${feedback.userAgent}` : '',
    '',
    feedback.message,
  ].filter(Boolean).join('\n');
}

function value(form, key) {
  const raw = form.get(key);
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function respond(payload, status, wantsJson) {
  if (wantsJson) {
    return new Response(JSON.stringify(payload), {
      status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  const title = payload.ok ? 'Feedback received' : 'Feedback not sent';
  const fallback = payload.fallbackEmail
    ? `<p>Email <a href="mailto:${escapeHtml(payload.fallbackEmail)}?subject=Dkompos%20feedback">${escapeHtml(payload.fallbackEmail)}</a> instead.</p>`
    : '';

  return new Response(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} — Dkompos</title>
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <main class="page">
      <p class="eyebrow">Feedback</p>
      <h1>${title}.</h1>
      <p>${escapeHtml(payload.message)}</p>
      ${fallback}
      <p><a class="text-link" href="/contact.html">Back to feedback</a></p>
    </main>
  </body>
</html>`, {
    status,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
