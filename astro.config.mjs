import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), '');
const site = env.PUBLIC_SITE_URL || process.env.PUBLIC_SITE_URL || 'http://localhost:4321';

export default defineConfig({
  site,
  output: 'static',
  session: false,
  adapter: cloudflare({
    imageService: 'compile',
    prerenderEnvironment: 'node',
  }),
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en',
          id: 'id',
        },
      },
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'id'],
    routing: {
      prefixDefaultLocale: true,
    },
  },
  redirects: {
    '/': '/en',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
