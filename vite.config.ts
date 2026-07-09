import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    host: true, // listen on 0.0.0.0 — reachable via LAN private IP
    port: 5173,
    strictPort: true,
    open: false,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});

