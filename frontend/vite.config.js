import fs from 'fs';
import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('/app/certs/localhost-key.pem'),
      cert: fs.readFileSync('/app/certs/localhost.pem'),
    },
    port: 3000,
    open: false,
    strictPort: true,
    host: "0.0.0.0",
    hmr: {
      protocol: 'wss',
      host: 'localhost',
      port: 8443,
      path: '/ws/',
    },
    watch: {
      usePolling: true
    },
    allowedHosts: [
      'localhost',
      'f2r8s16'
    ]
  },
  publicDir: 'public',
  preview: {
    port: 3000,
    host: "0.0.0.0",
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    outDir: './src/dist',
  },
});
