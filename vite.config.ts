import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({

  base: '/myapp/',

  // Plugins used by Vite
  plugins: [
    react() // Enables React JSX transform and Fast Refresh
  ],

  // ✅ Server settings
  server: {
    port: 8501,        // Change this to any port you want
    open: true,        // Auto opens browser when you run npm run dev
    host: true,        // Makes it accessible on your local network
  },

  resolve: {
    alias: {
      // @/* → src/*  (catch-all alias)
      '@': path.resolve(__dirname, './src'),

      // @components/Button → src/components/Button
      '@components': path.resolve(__dirname, './src/components'),

      // @pages/Login → src/pages/Login
      '@pages':      path.resolve(__dirname, './src/pages'),

      // @services/api → src/services/api
      '@services':   path.resolve(__dirname, './src/services'),

      // @store/index → src/store/index
      '@store':      path.resolve(__dirname, './src/store'),

      // @hooks/useAuth → src/hooks/useAuth
      '@hooks':      path.resolve(__dirname, './src/hooks'),

      // @utils/validators → src/utils/validators
      '@utils':      path.resolve(__dirname, './src/utils'),

      // @config/env → src/config/env
      '@config':     path.resolve(__dirname, './src/config'),
    },
  },
})