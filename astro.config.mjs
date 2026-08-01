import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  site: 'https://aks-aeromodels.com',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto'
  }
});
