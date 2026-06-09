import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/hvideo-lite-web/' : '/',
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
  resolve: {
    alias: {
      // Fix deep import resolution for @ant-design/icons under Vite 8 + Rolldown
      '@ant-design/icons-svg/es/asn': '@ant-design/icons-svg/lib/asn',
    },
  },
  optimizeDeps: {
    include: ['@ant-design/icons', '@ant-design/icons-svg'],
    force: true,
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
  },
})
