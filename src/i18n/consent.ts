import type { Locale } from './locale';

export type ConsentCopy = {
  title: string;
  body: string;
  accept: string;
  reject: string;
  choose: string;
  save: string;
  necessary: string;
  analytics: string;
  analyticsHelp: string;
  marketing: string;
  marketingHelp: string;
};

/**
 * Banner copy for the live locales.
 * German, Spanish, French, and Turkish (`de`, `es`, `fr`, `tr`) slot in by
 * adding the code to `locales` in `locale.ts` and a matching key here and in `ui`.
 * Until that copy exists, `consentCopy` falls back to English.
 */
const bundles: Record<Locale, ConsentCopy> = {
  en: {
    title: 'Cookies',
    body: 'A cookieless Cloudflare counter can run without a choice. Google Analytics stays off unless you allow it. Advertising tags (none are installed today) stay off unless you allow those too.',
    accept: 'Accept all',
    reject: 'Reject optional',
    choose: 'Choose',
    save: 'Save choices',
    necessary: 'A necessary cookie remembers this choice. It is not used to follow you around.',
    analytics: 'Analytics',
    analyticsHelp: 'Google Analytics, so we can see which pages are read. The tag loads only after you allow it.',
    marketing: 'Marketing',
    marketingHelp: 'Reserved for a future Meta or TikTok tag. Nothing loads today. A tag would load only after you allow it.',
  },
  id: {
    title: 'Cookie',
    body: 'Penghitung Cloudflare yang tanpa cookie boleh berjalan tanpa pilihan. Google Analytics tetap mati kecuali kamu mengizinkan. Tag iklan (belum ada yang dipasang) tetap mati kecuali kamu mengizinkan itu juga.',
    accept: 'Izinkan semua',
    reject: 'Tolak yang opsional',
    choose: 'Pilih',
    save: 'Simpan pilihan',
    necessary: 'Cookie yang perlu mengingat pilihan ini. Cookie itu tidak dipakai untuk mengikutimu.',
    analytics: 'Analitik',
    analyticsHelp: 'Google Analytics, supaya terlihat halaman mana yang dibaca. Tag-nya baru dimuat setelah kamu mengizinkan.',
    marketing: 'Pemasaran',
    marketingHelp: 'Disiapkan untuk tag Meta atau TikTok nanti. Sekarang tidak ada yang dimuat. Tag baru dimuat setelah kamu mengizinkan.',
  },
};

export function consentCopy(locale: string): ConsentCopy {
  if (locale in bundles) return bundles[locale as Locale];
  return bundles.en;
}
