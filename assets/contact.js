const form = document.querySelector('[data-feedback-form]');
const status = document.querySelector('[data-feedback-status]');

function setStatus(message, tone = 'neutral') {
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function buildMailto(formData) {
  const topic = formData.get('topic') || 'general';
  const context = formData.get('context') || '';
  const message = formData.get('message') || '';
  const body = [
    `Kind: ${topic}`,
    context ? `Setup: ${context}` : '',
    '',
    message,
  ].filter(Boolean).join('\n');

  const params = new URLSearchParams({
    subject: `Dkompos feedback: ${topic}`,
    body,
  });

  return `mailto:hello@dkompos.com?${params.toString()}`;
}

function offerEmailFallback(fallbackHref) {
  const directLink = form.querySelector('.feedback-actions .text-link');
  directLink?.setAttribute('href', fallbackHref);
  directLink?.focus();
  setStatus('Opening your email app with this note. If it does not open, use Email directly.', 'neutral');
  window.location.href = fallbackHref;
}

if (form instanceof HTMLFormElement) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('button[type="submit"]');
    const formData = new FormData(form);
    const fallbackHref = buildMailto(formData);

    setStatus('Sending...', 'neutral');
    submitButton?.setAttribute('disabled', 'disabled');

    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const reason = payload?.message || 'The feedback endpoint is not ready.';
        if (payload?.fallbackEmail || response.status >= 500) {
          offerEmailFallback(fallbackHref);
          return;
        }
        setStatus(`${reason} Use the email link if this is urgent.`, 'error');
        return;
      }

      form.reset();
      setStatus('Received. Thank you for helping shape Dkompos.', 'success');
    } catch {
      offerEmailFallback(fallbackHref);
    } finally {
      submitButton?.removeAttribute('disabled');
    }
  });
}
