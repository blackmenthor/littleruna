export type LeadKind = 'contact' | 'newsletter';

/** Short-lived, non-HttpOnly cookie so the next page can fire a GA4 lead exactly once. */
export function leadCookie(request: Request, kind: LeadKind): string {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `lr_lead=${kind}; Path=/; Max-Age=300; SameSite=Lax${secure}`;
}
