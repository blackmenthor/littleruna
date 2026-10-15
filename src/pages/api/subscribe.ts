import type { APIRoute } from 'astro';
import { isLocale, type Locale } from '../../i18n/locale';
import { isNewsletterCountry } from '../../lib/newsletter';
import { saveNewsletterContact } from '../../lib/resend-contacts';
import { readSecret } from '../../lib/worker-env';

export const prerender = false;

type Payload = {
  email: string;
  country: string;
  locale: Locale;
  consent: boolean;
};

function field(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function parse(data: FormData): Payload | null {
  const locale = field(data, 'locale');
  const country = field(data, 'country');
  const payload: Payload = {
    email: field(data, 'email'),
    country,
    locale: isLocale(locale) ? locale : 'en',
    consent: data.get('consent') === 'on' || data.get('consent') === 'true',
  };
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email);
  if (!emailOk || payload.email.length > 160) return null;
  if (payload.country && !isNewsletterCountry(payload.country)) return null;
  if (!payload.consent) return null;
  return payload;
}

function backUrl(request: Request, locale: Locale, query: string): URL {
  const fallback = new URL(`/${locale}/?${query}`, request.url);
  const referer = request.headers.get('referer');
  if (!referer) return fallback;
  try {
    const url = new URL(referer);
    if (url.origin !== new URL(request.url).origin) return fallback;
    url.search = query.startsWith('?') ? query : `?${query}`;
    url.hash = '';
    return url;
  } catch {
    return fallback;
  }
}

export const POST: APIRoute = async ({ request }) => {
  const wantsJson = request.headers.get('accept')?.includes('application/json');
  const data = await request.formData();
  const payload = parse(data);
  const localeField = field(data, 'locale');
  const locale: Locale = payload?.locale ?? (isLocale(localeField) ? localeField : 'en');

  const reply = (query: string, body: { ok: boolean; code?: string; tracked?: boolean }, status = body.ok ? 200 : 400) =>
    wantsJson ? Response.json(body, { status }) : Response.redirect(backUrl(request, locale, query), 303);

  if (field(data, 'company')) {
    return reply('joined=1', { ok: true });
  }

  if (!payload) {
    return reply('list=invalid', { ok: false, code: 'invalid' }, 400);
  }

  const apiKey = await readSecret('RESEND_API_KEY');
  const audienceId = await readSecret('RESEND_AUDIENCE_ID');
  if (!apiKey || !audienceId) {
    return reply('list=not_configured', { ok: false, code: 'not_configured' }, 503);
  }

  try {
    await saveNewsletterContact(apiKey, audienceId, payload.email, payload.country);
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Newsletter save failed');
    return reply('list=send', { ok: false, code: 'send_failed' }, 502);
  }

  return reply('joined=1&signup=1', { ok: true, tracked: true });
};
