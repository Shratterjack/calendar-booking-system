import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    vue(),
    // Only enable devtools in development
    mode === 'development' && vueDevTools(),
    tailwindcss(),
  ].filter(Boolean),

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },

  // Build optimizations
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'calendar-vendor': ['v-calendar'],
        },
      },
    },
    // Generate source maps for production debugging
    sourcemap: false,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },

  // Performance optimizations
  optimizeDeps: {
    include: ['vue', 'vue-router', 'v-calendar'],
  },

  // Preview server configuration for production testing
  preview: {
    port: 4173,
    strictPort: true,
  },
}))
