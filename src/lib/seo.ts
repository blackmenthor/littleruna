import { createClient } from '@sanity/client';
import { integrations, sanityConfigured } from '../config';
import type { Locale } from '../i18n/locale';

export type SiteSeo = {
  name: Record<Locale, string>;
  title: Record<Locale, string>;
  description: Record<Locale, string>;
  phrases: Record<Locale, string[]>;
};

export const fallbackSeo: SiteSeo = {
  name: {
    en: 'Little Runa',
    id: 'Little Runa',
  },
  title: {
    en: 'Little Runa · Girls’ clothes from revived fabrics',
    id: 'Little Runa · Baju anak perempuan dari kain bekas',
  },
  description: {
    en: 'Little Runa sews girls’ dresses and clothes from revived fabrics: old bedsheets, clothes, and blankets. Made to order for Europe and Indonesia.',
    id: 'Little Runa menjahit dress dan baju anak perempuan dari kain yang dihidupkan kembali: sprei, baju, dan selimut bekas. Dibuat sesuai permintaan untuk Eropa dan Indonesia.',
  },
  phrases: {
    en: [
      'girls clothes',
      'girls dresses',
      'handmade girls clothing',
      'children’s clothes',
      'upcycled kids clothing',
      'revived fabric',
      'sustainable children’s clothing',
      'made to order girls dresses',
    ],
    id: [
      'baju anak perempuan',
      'dress anak perempuan',
      'baju anak handmade',
      'pakaian anak dari kain bekas',
      'baju anak upcycled',
      'kain yang dihidupkan kembali',
      'baju anak perempuan made to order',
    ],
  },
};

type SanitySeo = {
  name?: Partial<Record<Locale, string>>;
  title?: Partial<Record<Locale, string>>;
  description?: Partial<Record<Locale, string>>;
  phrases?: { en?: unknown; id?: unknown };
};

function text(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function phrases(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.map((item) => (typeof item === 'string' ? item.trim() : '')).filter(Boolean);
  return items.length > 0 ? items : fallback;
}

function normalize(doc: SanitySeo | null): SiteSeo {
  if (!doc) return fallbackSeo;
  return {
    name: {
      en: text(doc.name?.en, fallbackSeo.name.en),
      id: text(doc.name?.id, text(doc.name?.en, fallbackSeo.name.id)),
    },
    title: {
      en: text(doc.title?.en, fallbackSeo.title.en),
      id: text(doc.title?.id, text(doc.title?.en, fallbackSeo.title.id)),
    },
    description: {
      en: text(doc.description?.en, fallbackSeo.description.en),
      id: text(doc.description?.id, text(doc.description?.en, fallbackSeo.description.id)),
    },
    phrases: {
      en: phrases(doc.phrases?.en, fallbackSeo.phrases.en),
      id: phrases(doc.phrases?.id, fallbackSeo.phrases.id),
    },
  };
}

let pending: Promise<SiteSeo> | null = null;

export function getSiteSeo(): Promise<SiteSeo> {
  pending ??= loadSiteSeo();
  return pending;
}

async function loadSiteSeo(): Promise<SiteSeo> {
  if (!sanityConfigured) return fallbackSeo;
  try {
    const client = createClient({
      projectId: integrations.sanityProjectId,
      dataset: integrations.sanityDataset,
      apiVersion: integrations.sanityApiVersion,
      useCdn: true,
    });
    const doc = await client.fetch<SanitySeo | null>(`*[_id == "siteSettings"][0]{
      name, title, description, phrases
    }`);
    return normalize(doc);
  } catch (error) {
    console.error('Sanity site settings query failed. Using the built-in SEO copy.', error);
    return fallbackSeo;
  }
}
