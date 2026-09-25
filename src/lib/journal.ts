import { createClient, type SanityClient } from '@sanity/client';
import { integrations, sanityConfigured } from '../config';
import { fallbackArticles, type JournalArticle } from '../data/journal';

type SanityArticle = {
  slug?: string;
  title?: { en?: string; id?: string };
  excerpt?: { en?: string; id?: string };
  body?: { en?: string; id?: string };
  publishedAt?: string;
  image?: { alt?: string; asset?: { url?: string } };
};

const query = `*[_type == "article" && defined(slug.current)] | order(publishedAt desc) {
  "slug": slug.current,
  title,
  excerpt,
  body,
  publishedAt,
  image{
    alt,
    asset->{url}
  }
}`;

let client: SanityClient | null = null;

function getClient(): SanityClient | null {
  if (!sanityConfigured) return null;
  client ??= createClient({
    projectId: integrations.sanityProjectId,
    dataset: integrations.sanityDataset,
    apiVersion: integrations.sanityApiVersion,
    useCdn: true,
  });
  return client;
}

function text(value: string | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

function coverImage(image: SanityArticle['image'], alt: string): JournalArticle['image'] {
  const url = image?.asset?.url?.trim();
  if (!url) return null;
  const sized = new URL(url);
  sized.searchParams.set('auto', 'format');
  sized.searchParams.set('w', '1600');
  sized.searchParams.set('fit', 'max');
  return {
    url: sized.toString(),
    alt: image?.alt?.trim() || alt,
  };
}

function normalize(doc: SanityArticle): JournalArticle | null {
  const slug = doc.slug?.trim();
  const titleEn = doc.title?.en?.trim();
  if (!slug || !titleEn) return null;
  return {
    slug,
    title: {
      en: titleEn,
      id: text(doc.title?.id, titleEn),
    },
    excerpt: {
      en: text(doc.excerpt?.en, ''),
      id: text(doc.excerpt?.id, text(doc.excerpt?.en, '')),
    },
    body: {
      en: text(doc.body?.en, ''),
      id: text(doc.body?.id, text(doc.body?.en, '')),
    },
    publishedAt: doc.publishedAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    image: coverImage(doc.image, titleEn),
  };
}

export async function getArticles(): Promise<JournalArticle[]> {
  const sanity = getClient();
  if (!sanity) return fallbackArticles;
  try {
    const docs = await sanity.fetch<SanityArticle[]>(query);
    return docs.map(normalize).filter((article): article is JournalArticle => article !== null);
  } catch (error) {
    console.error('Sanity journal query failed. The journal will render empty.', error);
    return [];
  }
}

export async function getArticle(slug: string): Promise<JournalArticle | undefined> {
  const articles = await getArticles();
  return articles.find((article) => article.slug === slug);
}
