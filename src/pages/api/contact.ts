import type { APIRoute } from 'astro';
import { isLocale, type Locale } from '../../i18n/locale';
import { leadCookie } from '../../lib/lead-cookie';
import { readSecret } from '../../lib/secrets';
import { thanksRedirect } from '../../lib/thanks';

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
  const localeValue = field(data, 'locale');
  const locale = isLocale(localeValue) ? localeValue : 'en';
  const back = `/${locale}/contact`;
  const page = (error?: string, cookie?: string) =>
    thanksRedirect(request, { locale, kind: 'contact', back, error, cookie });

  if (field(data, 'company')) {
    return wantsJson ? Response.json({ ok: true }) : page();
  }

  if (!payload) {
    return wantsJson ? Response.json({ ok: false, code: 'invalid' }, { status: 400 }) : page('invalid');
  }

  const apiKey = await readSecret('RESEND_API_KEY');
  const to = await readSecret('CONTACT_TO_EMAIL');
  const from = await readSecret('CONTACT_FROM_EMAIL');

  if (!apiKey || !to || !from) {
    return wantsJson ? Response.json({ ok: false, code: 'not_configured' }, { status: 503 }) : page('not_configured');
  }

  try {
    await sendMail(payload, apiKey, to, from);
  } catch (error) {
    console.error(error);
    return wantsJson ? Response.json({ ok: false, code: 'send_failed' }, { status: 502 }) : page('send');
  }

  const cookie = leadCookie(request, 'contact');
  if (wantsJson) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
    });
  }
  return page(undefined, cookie);
};
