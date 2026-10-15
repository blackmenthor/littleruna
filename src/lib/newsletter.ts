import type { Locale } from '../i18n/locale';

export const newsletterCountries = ['DE', 'ES', 'FR', 'TR', 'ID', 'EU', 'OTHER'] as const;
export type NewsletterCountry = (typeof newsletterCountries)[number];

export function isNewsletterCountry(value: string): value is NewsletterCountry {
  return (newsletterCountries as readonly string[]).includes(value);
}

/** Only in-site locale paths may be used as the post-signup redirect. */
export function safeReturnPath(value: string, locale: Locale): string {
  const fallback = `/${locale}`;
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('://') || value.includes('..')) {
    return fallback;
  }
  const path = value.split('?')[0]?.split('#')[0] ?? '';
  if (!/^\/(en|id)(\/[A-Za-z0-9][A-Za-z0-9-]*)*$/.test(path)) return fallback;
  return path;
}
