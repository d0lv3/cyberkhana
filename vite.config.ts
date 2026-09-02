import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: 'http://localhost:5001',
            changeOrigin: true,
          },
          '/socket.io': {
            target: 'http://localhost:5001',
            changeOrigin: true,
            ws: true,
          },
        },
      },
      plugins: [react()],
      // Skip the gzip-size report — it buffers every chunk through gzip and can
      // OOM the shared Coolify build box (the Academy deploy failed the same way
      // at "computing gzip size").
      build: {
        reportCompressedSize: false,
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
