/// <reference types="astro/client" />

interface Env {
  RESEND_API_KEY?: string;
  CONTACT_TO_EMAIL?: string;
  CONTACT_FROM_EMAIL?: string;
  RESEND_AUDIENCE_ID?: string;
}

declare module 'cloudflare:workers' {
  export const env: Env;
}

interface ImportMetaEnv {
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_SANITY_PROJECT_ID?: string;
  readonly PUBLIC_SANITY_DATASET?: string;
  readonly PUBLIC_CF_BEACON_TOKEN?: string;
  readonly PUBLIC_GA4_ID?: string;
  readonly RESEND_API_KEY?: string;
  readonly CONTACT_TO_EMAIL?: string;
  readonly CONTACT_FROM_EMAIL?: string;
  readonly RESEND_AUDIENCE_ID?: string;
}

interface LittleRunaAnalytics {
  track: (name: string, params?: Record<string, string>) => void;
  openConsent: () => void;
  /** Future Meta or TikTok tags must check `marketing` and stay out of the HTML until it is true. */
  allows: (category: 'analytics' | 'marketing') => boolean;
}

interface Window {
  LittleRuna?: LittleRunaAnalytics;
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}
