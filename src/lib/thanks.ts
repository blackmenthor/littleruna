import type { Locale } from '../i18n/locale';
import { safeReturnPath } from './newsletter';

export type ThanksKind = 'contact' | 'newsletter';

/** No-JS forms land here. The page is server-rendered, so the message can follow the query. */
export function thanksRedirect(
  request: Request,
  options: { locale: Locale; kind: ThanksKind; back: string; error?: string; cookie?: string },
): Response {
  const url = new URL('/thanks', request.url);
  url.searchParams.set('lang', options.locale);
  url.searchParams.set('kind', options.kind);
  url.searchParams.set('back', safeReturnPath(options.back, options.locale));
  if (options.error) url.searchParams.set('error', options.error);
  const headers = new Headers({ Location: url.href });
  if (options.cookie) headers.set('Set-Cookie', options.cookie);
  return new Response(null, { status: 303, headers });
}
