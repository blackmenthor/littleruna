import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.PUBLIC_SANITY_PROJECT_ID || '',
    dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
  },
  deployment: {
    appId: 'swp1dc5f4xra3t8zs0bk0j25',
  },
});
