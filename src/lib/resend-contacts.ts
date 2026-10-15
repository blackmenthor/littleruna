type ResendFailure = { ok: false; status: number; text: string };
type ResendResult = { ok: true } | ResendFailure;

function redact(text: string): string {
  return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]').slice(0, 300);
}

function resendError(result: ResendFailure): Error {
  return new Error(`Resend ${result.status}: ${redact(result.text)}`);
}

async function callResend(apiKey: string, method: string, path: string, body?: unknown): Promise<ResendResult> {
  const response = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.ok) return { ok: true };
  return { ok: false, status: response.status, text: await response.text() };
}

function isDuplicate(result: ResendFailure): boolean {
  return result.status === 409 || (result.status === 422 && /already exists/i.test(result.text));
}

/**
 * Resend renamed Audiences to Segments. A missing segment, or a response that
 * still talks about audiences, means this id belongs on the legacy path.
 */
function shouldTryLegacyAudience(result: ResendFailure): boolean {
  if (result.status === 404) return true;
  if (/audience/i.test(result.text)) return true;
  return /segment/i.test(result.text) && /(not found|invalid|unknown|does not exist)/i.test(result.text);
}

async function attachExisting(apiKey: string, audienceId: string, email: string, country?: string): Promise<void> {
  const added = await callResend(
    apiKey,
    'POST',
    `/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(audienceId)}`,
  );

  if (!added.ok && !isDuplicate(added)) {
    if (shouldTryLegacyAudience(added)) {
      const legacy = await callResend(apiKey, 'POST', `/audiences/${encodeURIComponent(audienceId)}/contacts`, {
        email,
        unsubscribed: false,
      });
      if (legacy.ok || isDuplicate(legacy)) return;
      throw resendError(legacy);
    }
    throw resendError(added);
  }

  const patchBody: { unsubscribed: false; properties?: { country: string } } = { unsubscribed: false };
  if (country) patchBody.properties = { country };
  const patched = await callResend(apiKey, 'PATCH', `/contacts/${encodeURIComponent(email)}`, patchBody);
  if (!patched.ok && country) {
    await callResend(apiKey, 'PATCH', `/contacts/${encodeURIComponent(email)}`, { unsubscribed: false });
  }
}

/**
 * Creates a contact on the Resend Contacts API and adds `audienceId` as a segment.
 * Falls back to `POST /audiences/:id/contacts` when the account still uses Audiences.
 * `country` is the contact property `country`. A missing property does not fail the signup.
 */
export async function saveWaitlistContact(options: {
  apiKey: string;
  audienceId: string;
  email: string;
  country?: string;
}): Promise<void> {
  const { apiKey, audienceId, email, country } = options;
  const base = {
    email,
    unsubscribed: false,
    segments: [{ id: audienceId }],
  };

  let created = await callResend(
    apiKey,
    'POST',
    '/contacts',
    country ? { ...base, properties: { country } } : base,
  );

  if (!created.ok && country && !isDuplicate(created)) {
    const withoutCountry = await callResend(apiKey, 'POST', '/contacts', base);
    if (withoutCountry.ok || isDuplicate(withoutCountry)) created = withoutCountry;
    else if (!shouldTryLegacyAudience(created)) created = withoutCountry;
  }

  if (created.ok) return;

  if (isDuplicate(created)) {
    await attachExisting(apiKey, audienceId, email, country);
    return;
  }

  if (shouldTryLegacyAudience(created)) {
    const legacy = await callResend(apiKey, 'POST', `/audiences/${encodeURIComponent(audienceId)}/contacts`, {
      email,
      unsubscribed: false,
    });
    if (legacy.ok || isDuplicate(legacy)) return;
    throw resendError(legacy);
  }

  throw resendError(created);
}
