import { defineConfig } from 'vite';
import site from './site.config.js';

// Replaces %link:<key>% placeholders in index.html with URLs from site.config.js.
function siteLinks() {
  return {
    name: 'valforum-site-links',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) =>
        html.replace(/%link:(\w+)%/g, (_, key) => {
          if (!(key in site.links)) throw new Error(`index.html uses unknown link "${key}" (add it to site.config.js)`);
          return site.links[key];
        }),
    },
  };
}

export default defineConfig({
  // Relative asset URLs, so the build works under a sub-path (GitHub Pages) or at a domain root.
  base: './',
  plugins: [siteLinks()],
  build: {
    // Images are already optimised WebP; keep them as files so they cache independently.
    assetsInlineLimit: 0,
    target: 'es2020',
  },
});
