export const site = {
  name: 'Little Runa',
  description: {
    en: 'Girls’ clothes sewn from revived fabrics, for Europe and Indonesia.',
    id: 'Baju anak perempuan dari kain yang dihidupkan kembali, untuk Eropa dan Indonesia.',
  },
};

export const integrations = {
  sanityProjectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID?.trim() ?? '',
  sanityDataset: import.meta.env.PUBLIC_SANITY_DATASET?.trim() || 'production',
  sanityApiVersion: '2026-01-01',
};

export const sanityConfigured = integrations.sanityProjectId.length > 0;
