import type { ImageMetadata } from 'astro';
import type { Locale } from '../i18n/locale';

export type StylePiece = {
  slug: string;
  name: string;
  images: ImageMetadata[];
  summary: Record<Locale, string>;
};

const modules = import.meta.glob<{ default: ImageMetadata }>('../assets/styles/*/*.jpg', {
  eager: true,
});

const copy: Record<string, Record<Locale, string>> = {
  ailsa: {
    en: 'A pale dress with an embroidered bodice and a floral skirt.',
    id: 'Baju pucat dengan bordir di badan atas dan rok bermotif bunga.',
  },
  belle: {
    en: 'Fairy print and pink flowers, finished with a soft ruffle.',
    id: 'Motif peri dan bunga merah muda, dengan kerutan yang lembut.',
  },
  fiora: {
    en: 'A storybook print, white lace, and a full skirt.',
    id: 'Motif buku cerita, renda putih, dan rok yang mengembang.',
  },
  fleur: {
    en: 'A named style, sewn from revived fabric.',
    id: 'Sebuah gaya bernama, dijahit dari kain yang dihidupkan kembali.',
  },
  lily: {
    en: 'A named style, sewn from revived fabric.',
    id: 'Sebuah gaya bernama, dijahit dari kain yang dihidupkan kembali.',
  },
  mariposa: {
    en: 'Mint gingham under floral embroidery and a lace collar.',
    id: 'Gingham mint di bawah bordir bunga dan kerah renda.',
  },
  pippa: {
    en: 'A named style, sewn from revived fabric.',
    id: 'Sebuah gaya bernama, dijahit dari kain yang dihidupkan kembali.',
  },
  poppy: {
    en: 'Long sleeves, a storybook print, and tiers of lace.',
    id: 'Lengan panjang, motif buku cerita, dan renda bertingkat.',
  },
  rosalina: {
    en: 'A named style, sewn from revived fabric.',
    id: 'Sebuah gaya bernama, dijahit dari kain yang dihidupkan kembali.',
  },
  sugarplum: {
    en: 'Cutwork flowers laid over a printed cloth.',
    id: 'Bunga terawang di atas kain bermotif.',
  },
};

function titleCase(slug: string): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

const grouped = new Map<string, { file: string; image: ImageMetadata }[]>();

for (const [path, mod] of Object.entries(modules)) {
  const match = path.match(/styles\/([^/]+)\/([^/]+\.jpg)$/);
  if (!match) continue;
  const slug = match[1];
  const file = match[2];
  const list = grouped.get(slug) ?? [];
  list.push({ file, image: mod.default });
  grouped.set(slug, list);
}

export const styles: StylePiece[] = [...grouped.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([slug, images]) => ({
    slug,
    name: titleCase(slug),
    images: images.sort((a, b) => a.file.localeCompare(b.file)).map((item) => item.image),
    summary: copy[slug] ?? {
      en: 'A named style, sewn from revived fabric.',
      id: 'Sebuah gaya bernama, dijahit dari kain yang dihidupkan kembali.',
    },
  }));

export const featuredSlugs = ['fiora', 'ailsa', 'mariposa'] as const;

export function getStyle(slug: string): StylePiece | undefined {
  return styles.find((style) => style.slug === slug);
}

export function featuredStyles(): StylePiece[] {
  return featuredSlugs.map((slug) => getStyle(slug)).filter((style): style is StylePiece => Boolean(style));
}
