import type { APIRoute } from 'astro';
import { isLocale, type Locale } from '../i18n/locale';
import { t } from '../i18n/ui';
import { GA4_ID } from '../lib/ids';
import { safeReturnPath } from '../lib/newsletter';
import { gaMeasurementId } from '../lib/public-config';

export const prerender = false;

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === '&') return '&amp;';
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    if (char === '"') return '&quot;';
    return '&#39;';
  });
}

export const GET: APIRoute = ({ url }) => {
  const kindParam = url.searchParams.get('kind');
  if (kindParam !== 'contact' && kindParam !== 'newsletter') {
    return Response.redirect(new URL('/en', url), 303);
  }
  const lang = url.searchParams.get('lang') ?? undefined;
  const locale: Locale = isLocale(lang) ? lang : 'en';
  const error = url.searchParams.get('error');
  const back = safeReturnPath(url.searchParams.get('back') ?? '', locale);
  const copy = t(locale);
  const errorText =
    error === 'not_configured'
      ? kindParam === 'contact'
        ? copy.notConfigured
        : copy.newsletterNotConfigured
      : error
        ? kindParam === 'contact'
          ? copy.sendError
          : copy.newsletterError
        : '';
  const title = errorText
    ? kindParam === 'contact'
      ? copy.contactTitle
      : copy.newsletterTitle
    : kindParam === 'contact'
      ? copy.sentTitle
      : copy.newsletterSentTitle;
  const text = errorText || (kindParam === 'contact' ? copy.sentText : copy.newsletterSentText);
  const ga4 = gaMeasurementId();
  const gaAttr = GA4_ID.test(ga4) ? ` data-ga4="${esc(ga4)}"` : '';

  const html = `<!doctype html>
<html lang="${locale}"${gaAttr}>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${esc(title)} · Little Runa</title>
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Outfit:wght@300;400;500&display=swap" rel="stylesheet" />
  <script>
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'denied',
      personalization_storage: 'denied',
      security_storage: 'granted',
      wait_for_update: 500
    });
    window.gtag('set', 'ads_data_redaction', true);
    window.gtag('set', 'url_passthrough', true);
  </script>
  <style>
    :root { color-scheme: light; }
    body { margin: 0; background: #f4efe8; color: #241f1c; font-family: Outfit, sans-serif; }
    a { color: inherit; }
    header { border-bottom: 1px solid #e3d9ce; }
    .bar { max-width: 72rem; margin: 0 auto; padding: 1rem 1.5rem; }
    .wordmark { font-family: "Cormorant Garamond", Georgia, serif; font-weight: 500; letter-spacing: 0.14em; text-decoration: none; }
    main { max-width: 40rem; margin: 0 auto; padding: 4rem 1.5rem; }
    .eyebrow { font-size: 0.72rem; letter-spacing: 0.22em; text-transform: uppercase; color: #a86b73; }
    h1 { font-size: 3rem; line-height: 1; margin: 0.5rem 0 0; }
    p { line-height: 1.7; color: #6f675f; }
    .back { display: inline-block; margin-top: 2rem; font-size: 0.72rem; letter-spacing: 0.22em; text-transform: uppercase; text-decoration: none; }
  </style>
</head>
<body>
  <header>
    <div class="bar"><a class="wordmark" href="/${locale}">LITTLE RUNA</a></div>
  </header>
  <main>
    <p class="eyebrow">${esc(copy.heroEyebrow)}</p>
    <h1 class="wordmark">${esc(title)}</h1>
    <p>${esc(text)}</p>
    <a class="back" href="${esc(back)}">${esc(copy.backLink)}</a>
  </main>
  <script>
    (function () {
      var root = document.documentElement;
      var id = root.getAttribute('data-ga4') || '';
      if (!/^G-[A-Z0-9]{4,32}$/.test(id)) return;
      var parts = document.cookie ? document.cookie.split('; ') : [];
      var lead = parts.find(function (part) { return part.indexOf('lr_lead=') === 0; });
      var consent = parts.find(function (part) { return part.indexOf('lr_consent=') === 0; });
      if (!lead || !consent) return;
      var kind = decodeURIComponent(lead.slice('lr_lead='.length));
      var choice = decodeURIComponent(consent.slice('lr_consent='.length));
      if (!/^v1\\.a1\\.m[01]$/.test(choice)) return;
      document.cookie = 'lr_lead=; Path=/; Max-Age=0; SameSite=Lax';
      var marketing = choice.charAt(choice.length - 1) === '1';
      window.gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage: marketing ? 'granted' : 'denied',
        ad_user_data: marketing ? 'granted' : 'denied',
        ad_personalization: marketing ? 'granted' : 'denied'
      });
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
      document.head.appendChild(script);
      window.gtag('js', new Date());
      window.gtag('config', id, { allow_google_signals: false, allow_ad_personalization_signals: false });
      if (kind === 'contact') window.gtag('event', 'generate_lead', { method: 'contact' });
      if (kind === 'newsletter') {
        window.gtag('event', 'generate_lead', { method: 'newsletter' });
        window.gtag('event', 'sign_up', { method: 'newsletter' });
      }
    })();
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
};
