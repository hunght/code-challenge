import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  base: './',
  server: {
    port: 3000,
    open: true,
    host: true,
    watch: {
      usePolling: false,
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  css: {
    devSourcemap: true,
  },
  optimizeDeps: {
    include: [],
  },
});
