import type { Locale } from '../i18n/locale';

export type JournalArticle = {
  slug: string;
  title: Record<Locale, string>;
  excerpt: Record<Locale, string>;
  body: Record<Locale, string>;
  publishedAt: string;
};

export const fallbackArticles: JournalArticle[] = [
  {
    slug: 'what-revived-fabric-means',
    title: {
      en: 'What revived fabric means here',
      id: 'Apa arti kain yang dihidupkan kembali',
    },
    excerpt: {
      en: 'Bedsheets, clothes, and blankets that still have cloth worth sewing.',
      id: 'Sprei, baju, dan selimut yang kainnya masih layak dijahit.',
    },
    body: {
      en: 'Little Runa does not start with a bolt of new cloth. A piece begins with something that was already used: a bedsheet, a garment, a blanket.\n\nWhat can be saved is washed, looked at, and cut again. Stains and thin spots are left behind. The rest becomes a dress, a collar, a sleeve.\n\nThis note is starter copy. Replace it from Sanity once the studio is connected.',
      id: 'Little Runa tidak mulai dari gulungan kain baru. Sebuah potong mulai dari sesuatu yang sudah pernah dipakai: sprei, baju, selimut.\n\nYang masih bisa diselamatkan dicuci, dilihat, lalu dipotong lagi. Noda dan bagian yang sudah tipis ditinggal. Sisanya menjadi baju, kerah, lengan.\n\nTulisan ini masih contoh. Ganti dari Sanity setelah studionya tersambung.',
    },
    publishedAt: '2026-09-01',
  },
  {
    slug: 'how-to-ask-for-a-piece',
    title: {
      en: 'How to ask for a piece',
      id: 'Cara meminta sebuah potong',
    },
    excerpt: {
      en: 'There is no cart. A request is a letter.',
      id: 'Tidak ada keranjang. Permintaan adalah sebuah surat.',
    },
    body: {
      en: 'If a style should be made for a child, use the contact form and mark it as a request. Write the age or the usual size, and anything the cloth should avoid.\n\nA reply is a conversation, not a receipt. Nothing is reserved until that conversation says so.\n\nThis note is starter copy. Replace it from Sanity once the studio is connected.',
      id: 'Kalau sebuah gaya ingin dibuatkan untuk seorang anak, pakai formulir kontak dan tandai sebagai permintaan. Tulis usia atau ukuran yang biasa dipakai, dan hal yang sebaiknya dihindari pada kainnya.\n\nBalasan adalah percakapan, bukan tanda terima. Tidak ada yang dikunci sebelum percakapan itu mengatakan begitu.\n\nTulisan ini masih contoh. Ganti dari Sanity setelah studionya tersambung.',
    },
    publishedAt: '2026-09-08',
  },
];
