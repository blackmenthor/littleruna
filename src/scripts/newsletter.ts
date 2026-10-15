function message(form: HTMLFormElement, key: string, fallback: string): string {
  return form.dataset[key] || fallback;
}

function bind(form: HTMLFormElement) {
  if (form.dataset.bound === 'true') return;
  form.dataset.bound = 'true';
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[data-newsletter-submit]');
    const error = form.querySelector('[data-newsletter-error]');
    const success = form.querySelector('[data-newsletter-success]');
    const fields = form.querySelector('[data-newsletter-fields]');
    const send = message(form, 'send', 'Join');
    const sending = message(form, 'sending', 'Joining…');
    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
      button.textContent = sending;
    }
    if (error instanceof HTMLElement) error.hidden = true;
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const body = (await response.json().catch(() => ({}))) as { ok?: boolean; code?: string; tracked?: boolean };
      if (response.ok && body.ok) {
        if (body.tracked) window.LittleRuna?.track('sign_up', { method: 'newsletter' });
        if (fields instanceof HTMLElement) fields.hidden = true;
        if (success instanceof HTMLElement) success.hidden = false;
        return;
      }
      const text =
        body.code === 'not_configured'
          ? message(form, 'notConfigured', 'The list is not connected yet.')
          : message(form, 'error', 'The list could not be updated.');
      if (error instanceof HTMLElement) {
        error.hidden = false;
        error.textContent = text;
      }
    } catch {
      if (error instanceof HTMLElement) {
        error.hidden = false;
        error.textContent = message(form, 'error', 'The list could not be updated.');
      }
    }
    if (button instanceof HTMLButtonElement) {
      button.disabled = false;
      button.textContent = send;
    }
  });
}

document.querySelectorAll('[data-newsletter-form]').forEach((form) => {
  if (form instanceof HTMLFormElement) bind(form);
});
