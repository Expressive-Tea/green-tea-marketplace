// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// One page, no MDX. The long-form writing about plugins lives in green-tea-docs; this site only
// answers "what exists, where does it run, where do I get it".
export default defineConfig({
  site: 'https://green-tea.expressive-tea.io',
  base: '/plugins',
  integrations: [sitemap()],
});
