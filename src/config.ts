export const site = {
  name: 'Little Runa',
  description: {
    en: 'Little Runa sews girls’ dresses and clothes from revived fabrics: old bedsheets, clothes, and blankets. Made to order for Europe and Indonesia.',
    id: 'Little Runa menjahit dress dan baju anak perempuan dari kain yang dihidupkan kembali: sprei, baju, dan selimut bekas. Dibuat sesuai permintaan untuk Eropa dan Indonesia.',
  },
};

export const integrations = {
  sanityProjectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID?.trim() ?? '',
  sanityDataset: import.meta.env.PUBLIC_SANITY_DATASET?.trim() || 'production',
  sanityApiVersion: '2026-01-01',
};

export const sanityConfigured = integrations.sanityProjectId.length > 0;
