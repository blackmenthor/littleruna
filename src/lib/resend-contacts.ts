type ResendResult = { ok: boolean; status: number; text: string };

function redact(text: string): string {
  return text.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]').slice(0, 300);
}

function mentions(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  return words.some((word) => lower.includes(word));
}

function isDuplicate(text: string): boolean {
  return mentions(text, ['already exist', 'already exists', 'duplicate']);
}

function isPropertyError(text: string): boolean {
  return mentions(text, ['property', 'properties']) && !isDuplicate(text);
}

async function resend(apiKey: string, method: string, path: string, body?: unknown): Promise<ResendResult> {
  const response = await fetch(`https://api.resend.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

async function addToSegment(apiKey: string, email: string, audienceId: string): Promise<ResendResult> {
  return resend(apiKey, 'POST', `/contacts/${encodeURIComponent(email)}/segments/${encodeURIComponent(audienceId)}`);
}

async function markSubscribed(apiKey: string, email: string, country: string): Promise<void> {
  const body: { unsubscribed: false; properties?: { country: string } } = { unsubscribed: false };
  if (country) body.properties = { country };
  const patched = await resend(apiKey, 'PATCH', `/contacts/${encodeURIComponent(email)}`, body);
  if (!patched.ok && country && isPropertyError(patched.text)) {
    console.warn('Resend contact property "country" was rejected. Create a string contact property named country.');
    await resend(apiKey, 'PATCH', `/contacts/${encodeURIComponent(email)}`, { unsubscribed: false });
  }
}

/**
 * Create a contact and file it in the Resend segment (formerly an audience).
 * A repeat signup updates the contact and joins the segment instead of failing.
 */
export async function saveNewsletterContact(
  apiKey: string,
  audienceId: string,
  email: string,
  country: string,
): Promise<void> {
  const createBody: {
    email: string;
    unsubscribed: false;
    segments: { id: string }[];
    properties?: { country: string };
  } = {
    email,
    unsubscribed: false,
    segments: [{ id: audienceId }],
  };
  if (country) createBody.properties = { country };

  let created = await resend(apiKey, 'POST', '/contacts', createBody);
  if (!created.ok && country && created.status === 422 && isPropertyError(created.text)) {
    console.warn('Resend contact property "country" was rejected. The address was saved without a country.');
    created = await resend(apiKey, 'POST', '/contacts', {
      email,
      unsubscribed: false,
      segments: [{ id: audienceId }],
    });
  }

  if (created.ok) return;

  if (created.status === 422 && isDuplicate(created.text)) {
    await markSubscribed(apiKey, email, country);
    const added = await addToSegment(apiKey, email, audienceId);
    if (added.ok || (added.status === 422 && isDuplicate(added.text))) return;
    console.error(`Resend segment add failed: ${added.status} ${redact(added.text)}`);
    throw new Error('Resend segment add failed');
  }

  console.error(`Resend contact create failed: ${created.status} ${redact(created.text)}`);
  throw new Error('Resend contact create failed');
}
