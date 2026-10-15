import type { APIRoute } from 'astro';
import { isLocale, type Locale } from '../../i18n/locale';
import { RESEND_AUDIENCE_ID } from '../../lib/ids';
import { leadCookie } from '../../lib/lead-cookie';
import { isNewsletterCountry, safeReturnPath } from '../../lib/newsletter';
import { saveWaitlistContact } from '../../lib/resend-contacts';
import { readSecret } from '../../lib/secrets';
import { thanksRedirect } from '../../lib/thanks';

export const prerender = false;

type Payload = {
  email: string;
  country?: string;
  locale: Locale;
  next: string;
};

function field(data: FormData, key: string): string {
  const value = data.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function localeOf(data: FormData): Locale {
  const value = field(data, 'locale');
  return isLocale(value) ? value : 'en';
}

function parse(data: FormData): Payload | null {
  const locale = localeOf(data);
  const email = field(data, 'email');
  const country = field(data, 'country');
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const consent = data.get('consent') === 'on' || data.get('consent') === 'true';
  if (!emailOk || email.length > 160) return null;
  if (!consent) return null;
  if (country && !isNewsletterCountry(country)) return null;
  return {
    email,
    country: country || undefined,
    locale,
    next: safeReturnPath(field(data, 'next'), locale),
  };
}

export const POST: APIRoute = async ({ request }) => {
  const wantsJson = request.headers.get('accept')?.includes('application/json');
  const data = await request.formData();
  const locale = localeOf(data);
  const back = safeReturnPath(field(data, 'next'), locale);
  const page = (error?: string, cookie?: string) =>
    thanksRedirect(request, { locale, kind: 'newsletter', back, error, cookie });

  if (field(data, 'company')) {
    return wantsJson ? Response.json({ ok: true }) : page();
  }

  const payload = parse(data);
  if (!payload) {
    return wantsJson ? Response.json({ ok: false, code: 'invalid' }, { status: 400 }) : page('invalid');
  }

  const apiKey = await readSecret('RESEND_API_KEY');
  const audienceId = await readSecret('RESEND_AUDIENCE_ID');
  if (!apiKey || !audienceId || !RESEND_AUDIENCE_ID.test(audienceId)) {
    return wantsJson
      ? Response.json({ ok: false, code: 'not_configured' }, { status: 503 })
      : page('not_configured');
  }

  try {
    await saveWaitlistContact({
      apiKey,
      audienceId,
      email: payload.email,
      country: payload.country,
    });
  } catch (error) {
    console.error(error);
    return wantsJson ? Response.json({ ok: false, code: 'send_failed' }, { status: 502 }) : page('send');
  }

  const cookie = leadCookie(request, 'newsletter');
  if (wantsJson) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
    });
  }
  return page(undefined, cookie);
};
