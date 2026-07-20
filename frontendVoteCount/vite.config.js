// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@pages': path.resolve(__dirname, 'src/pages'),
      '@services': path.resolve(__dirname, 'src/services'),
      '@context': path.resolve(__dirname, 'src/context'),
      '@assets': path.resolve(__dirname, 'src/assets'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@utils': path.resolve(__dirname, 'src/utils'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: '',
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            proxyReq.removeHeader('X-Forwarded-For');
            proxyReq.removeHeader('X-Forwarded-Proto');
            proxyReq.removeHeader('X-Forwarded-Host');
          });
        },
      },
      '/sanctum': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        cookieDomainRewrite: '',
      },
    },
    port: 5173,
    host: 'localhost',
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      timeout: 120000,
    },
  },
  // Optimisations
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'react-hot-toast', 'react-spinners', 'lucide-react'],
    exclude: [],
  },
  build: {
    sourcemap: false,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {                    // ← Changement important
          if (id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('react-router-dom')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/axios') ||
            id.includes('react-hot-toast') ||
            id.includes('lucide-react')) {
            return 'ui-vendor';
          }
        }
      },
    },
  },
})
