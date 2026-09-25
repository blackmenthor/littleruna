export const locales = ['en', 'id'] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string | undefined): value is Locale {
  return value === 'en' || value === 'id';
}

export function localePath(locale: Locale, path = '/'): string {
  const suffix = path === '/' ? '' : path.startsWith('/') ? path : `/${path}`;
  return `/${locale}${suffix}`;
}

export function swapLocale(pathname: string, next: Locale): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0 || !isLocale(parts[0])) {
    return localePath(next);
  }
  parts[0] = next;
  return `/${parts.join('/')}`;
}
