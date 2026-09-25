import type { APIRoute } from 'astro';
import { isLocale, type Locale } from '../../i18n/locale';

export const prerender = false;

const regions = ['europe', 'indonesia', 'other'] as const;
const intents = ['question', 'request'] as const;

type Payload = {
  name: string;
  email: string;
  region: (typeof regions)[number];
  intent: (typeof intents)[number];
  message: string;
  locale: Locale;
  consent: boolean;
  company: string;
};

async function readSecret(key: keyof Env): Promise<string | undefined> {
  try {
    const { env } = await import('cloudflare:workers');
    const fromWorkers = env?.[key];
    if (typeof fromWorkers === 'string' && fromWorkers.trim()) return fromWorkers.trim();
  } catch {
    // `cloudflare:workers` is empty during a plain Node preview.
  }
  const fromFile = import.meta.env[key];
  if (typeof fromFile === 'string' && fromFile.trim()) return fromFile.trim();
  return undefined;
}

function field(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function parse(data: FormData): Payload | null {
  const locale = field(data, 'locale');
  const region = field(data, 'region');
  const intent = field(data, 'intent');
  const payload: Payload = {
    name: field(data, 'name'),
    email: field(data, 'email'),
    region: regions.includes(region as Payload['region']) ? (region as Payload['region']) : 'other',
    intent: intents.includes(intent as Payload['intent']) ? (intent as Payload['intent']) : 'question',
    message: field(data, 'message'),
    locale: isLocale(locale) ? locale : 'en',
    consent: data.get('consent') === 'on' || data.get('consent') === 'true',
    company: field(data, 'company'),
  };

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
  if (!payload.name || payload.name.length > 80) return null;
  if (!emailOk || payload.email.length > 160) return null;
  if (payload.message.length < 10 || payload.message.length > 4000) return null;
  if (!payload.consent) return null;
  if (!regions.includes(payload.region) || !intents.includes(payload.intent)) return null;
  return payload;
}

async function sendMail(payload: Payload, apiKey: string, to: string, from: string) {
  const subject =
    payload.intent === 'request'
      ? `Little Runa request from ${payload.name}`
      : `Little Runa question from ${payload.name}`;
  const text = [
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Region: ${payload.region}`,
    `Kind: ${payload.intent}`,
    `Language: ${payload.locale}`,
    '',
    payload.message,
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: payload.email,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend ${response.status}: ${detail.slice(0, 300)}`);
  }
}

export const POST: APIRoute = async ({ request }) => {
  const wantsJson = request.headers.get('accept')?.includes('application/json');
  const data = await request.formData();
  const payload = parse(data);
  const back = `/${payload?.locale ?? 'en'}/contact`;

  if (field(data, 'company')) {
    return wantsJson
      ? Response.json({ ok: true })
      : Response.redirect(new URL(`${back}?sent=1`, request.url), 303);
  }

  if (!payload) {
    return wantsJson
      ? Response.json({ ok: false, code: 'invalid' }, { status: 400 })
      : Response.redirect(new URL(`${back}?error=invalid`, request.url), 303);
  }

  const apiKey = await readSecret('RESEND_API_KEY');
  const to = await readSecret('CONTACT_TO_EMAIL');
  const from = await readSecret('CONTACT_FROM_EMAIL');

  if (!apiKey || !to || !from) {
    return wantsJson
      ? Response.json({ ok: false, code: 'not_configured' }, { status: 503 })
      : Response.redirect(new URL(`${back}?error=not_configured`, request.url), 303);
  }

  try {
    await sendMail(payload, apiKey, to, from);
  } catch (error) {
    console.error(error);
    return wantsJson
      ? Response.json({ ok: false, code: 'send_failed' }, { status: 502 })
      : Response.redirect(new URL(`${back}?error=send`, request.url), 303);
  }

  return wantsJson
    ? Response.json({ ok: true })
    : Response.redirect(new URL(`${back}?sent=1`, request.url), 303);
};
