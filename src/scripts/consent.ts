const COOKIE = 'lr_consent';
const MAX_AGE = 60 * 60 * 24 * 180;
const PENDING_KEY = 'lr_pending_event';

type Choice = { analytics: boolean; marketing: boolean };
type PendingEvent = { name: string; params: Record<string, string> };

function readChoice(): Choice | null {
  const row = document.cookie.split('; ').find((part) => part.startsWith(`${COOKIE}=`));
  if (!row) return null;
  const value = decodeURIComponent(row.slice(COOKIE.length + 1));
  const [version, analytics, marketing] = value.split('.');
  if (version !== 'v1') return null;
  if (analytics !== '0' && analytics !== '1') return null;
  if (marketing !== '0' && marketing !== '1') return null;
  return { analytics: analytics === '1', marketing: marketing === '1' };
}

function writeChoice(choice: Choice) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  const value = `v1.${choice.analytics ? '1' : '0'}.${choice.marketing ? '1' : '0'}`;
  document.cookie = `${COOKIE}=${value}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax${secure}`;
}

function ga4Id(): string {
  return document.documentElement.dataset.ga4 ?? '';
}

let gaLoaded = false;

function loadGa4() {
  const id = ga4Id();
  if (!id || gaLoaded || typeof window.gtag !== 'function') return;
  gaLoaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
  window.gtag('js', new Date());
  window.gtag('config', id);
}

function applyConsent(choice: Choice) {
  const granted = (on: boolean) => (on ? 'granted' : 'denied');
  window.gtag?.('consent', 'update', {
    analytics_storage: granted(choice.analytics),
    ad_storage: granted(choice.marketing),
    ad_user_data: granted(choice.marketing),
    ad_personalization: granted(choice.marketing),
    functionality_storage: 'denied',
    personalization_storage: 'denied',
  });
  if (choice.analytics) loadGa4();
}

function showBanner(show: boolean) {
  const banner = document.querySelector('[data-consent-banner]');
  if (banner instanceof HTMLElement) banner.hidden = !show;
}

function readPending(): PendingEvent | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingEvent>;
    if (!parsed.name || typeof parsed.name !== 'string') return null;
    const params = parsed.params && typeof parsed.params === 'object' ? parsed.params : {};
    return { name: parsed.name, params };
  } catch {
    return null;
  }
}

function clearPending() {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    // Session storage can be blocked. The event is simply dropped.
  }
}

function remember(event: PendingEvent) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(event));
  } catch {
    // Without storage the event cannot wait for a later Accept.
  }
}

function send(name: string, params: Record<string, string>) {
  if (!readChoice()?.analytics || !ga4Id()) return;
  loadGa4();
  window.gtag?.('event', name, { ...params, transport_type: 'beacon' });
}

function track(name: string, params: Record<string, string> = {}) {
  const choice = readChoice();
  if (choice?.analytics) {
    send(name, params);
    return;
  }
  if (choice) return;
  remember({ name, params });
}

function flushPending() {
  const pending = readPending();
  clearPending();
  if (pending) send(pending.name, pending.params);
}

function choose(choice: Choice) {
  writeChoice(choice);
  applyConsent(choice);
  showBanner(false);
  if (choice.analytics) flushPending();
  else clearPending();
}

function consumeQueryEvent(flag: string, name: string, method: string) {
  const params = new URLSearchParams(window.location.search);
  if (params.get(flag) !== '1') return;
  params.delete(flag);
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  window.history.replaceState(null, '', next);
  track(name, { method });
}

window.LittleRuna = {
  track,
  openConsent() {
    showBanner(true);
  },
  allows(category) {
    return readChoice()?.[category] === true;
  },
};

const existing = readChoice();
if (existing) {
  applyConsent(existing);
  showBanner(false);
  if (existing.analytics) flushPending();
} else {
  showBanner(true);
}

consumeQueryEvent('lead', 'generate_lead', 'contact');
consumeQueryEvent('signup', 'sign_up', 'newsletter');

document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) return;
  if (target.closest('[data-consent-accept]')) choose({ analytics: true, marketing: true });
  else if (target.closest('[data-consent-reject]')) choose({ analytics: false, marketing: false });
  else if (target.closest('[data-consent-open]')) showBanner(true);
});
