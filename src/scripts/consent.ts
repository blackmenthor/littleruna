import { GA4_ID } from '../lib/ids';

export type ConsentChoice = {
  analytics: boolean;
  marketing: boolean;
};

type GtagFn = (...args: unknown[]) => void;
type QueuedEvent = {
  name: string;
  params: Record<string, string>;
};

const COOKIE = 'lr_consent';
const LEAD_COOKIE = 'lr_lead';
const MAX_AGE = 60 * 60 * 24 * 180;

const queued: QueuedEvent[] = [];
let memory: ConsentChoice | null = null;
let gaLoaded = false;
let marketingLoaded = false;

function gtag(): GtagFn {
  const win = window as Window & { dataLayer?: unknown[]; gtag?: GtagFn };
  win.dataLayer = win.dataLayer || [];
  if (!win.gtag) {
    win.gtag = (...args: unknown[]) => {
      win.dataLayer?.push(args);
    };
  }
  return win.gtag;
}

function measurementId(): string {
  const id = document.documentElement.dataset.ga4 ?? '';
  return GA4_ID.test(id) ? id : '';
}

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const entry = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  if (!entry) return null;
  return decodeURIComponent(entry.slice(prefix.length));
}

function writeCookie(name: string, value: string, maxAge: number): void {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

function clearCookie(name: string): void {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function readChoice(): ConsentChoice | null {
  const value = readCookie(COOKIE);
  const match = value ? /^v1\.a([01])\.m([01])$/.exec(value) : null;
  if (!match) return null;
  return { analytics: match[1] === '1', marketing: match[2] === '1' };
}

function decided(): ConsentChoice | null {
  return memory ?? readChoice();
}

function loadGa(): void {
  const id = measurementId();
  if (!id || gaLoaded) return;
  gaLoaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
  gtag()('js', new Date());
  gtag()('config', id, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
}

/**
 * Meta and TikTok snippets belong in this function.
 * It runs only after marketing consent, and never when that choice is absent or denied.
 * `document.documentElement.dataset.lrMarketing` is `on` only while that consent holds.
 */
function loadMarketingTags(): void {
  if (marketingLoaded) return;
  marketingLoaded = true;
}

function flush(): void {
  const events = queued.splice(0, queued.length);
  for (const event of events) {
    gtag()('event', event.name, event.params);
  }
}

function drop(): void {
  queued.length = 0;
}

export function applyConsent(choice: ConsentChoice): void {
  memory = choice;
  gtag()('consent', 'update', {
    analytics_storage: choice.analytics ? 'granted' : 'denied',
    ad_storage: choice.marketing ? 'granted' : 'denied',
    ad_user_data: choice.marketing ? 'granted' : 'denied',
    ad_personalization: choice.marketing ? 'granted' : 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
  });

  if (choice.analytics) {
    loadGa();
    flush();
  } else {
    drop();
  }

  document.documentElement.dataset.lrMarketing = choice.marketing ? 'on' : 'off';
  if (choice.marketing) loadMarketingTags();
}

export function writeChoice(choice: ConsentChoice): void {
  const value = `v1.a${choice.analytics ? '1' : '0'}.m${choice.marketing ? '1' : '0'}`;
  writeCookie(COOKIE, value, MAX_AGE);
  applyConsent(choice);
}

/** Queues until analytics consent exists. Drops the queue when analytics is refused. No-op without a GA4 id. */
export function track(name: string, params: Record<string, string> = {}): void {
  if (!measurementId()) return;
  const choice = decided();
  if (choice?.analytics) {
    gtag()('event', name, params);
    return;
  }
  if (choice && !choice.analytics) return;
  queued.push({ name, params });
}

/** Reads `lr_lead` only when it matches, then clears it. Other values are left for the matching caller. */
export function consumeLead(expected: 'contact' | 'newsletter'): boolean {
  if (readCookie(LEAD_COOKIE) !== expected) return false;
  clearCookie(LEAD_COOKIE);
  return true;
}

if (typeof document !== 'undefined') {
  const saved = readChoice();
  if (saved) applyConsent(saved);
}
