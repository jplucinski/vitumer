import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { cpSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

function staticOAuthCallback() {
  return {
    name: 'static-oauth-callback',
    closeBundle() {
      const outDir = resolve('dist')
      const callbackDir = resolve(outDir, 'openrouter/callback')
      mkdirSync(callbackDir, { recursive: true })
      cpSync(resolve(outDir, 'index.html'), resolve(callbackDir, 'index.html'))
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    port: 5173,
    watch: process.env.DEVCONTAINER || process.env.REMOTE_CONTAINERS
      ? { usePolling: true }
      : undefined,
  },
  preview: {
    host: true,
    port: 4173,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      injectRegister: 'auto',
      registerType: 'autoUpdate',
      manifest: {
        name: 'Vitumer',
        short_name: 'Vitumer',
        description: 'Hybrid AI Agent Timer for task focus and time planning',
        start_url: '/',
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#7c3aed',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/favicon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackAllowlist: [/^\/(?!assets\/).*/],
        globPatterns: ['**/*.{js,css,html,svg,ico,json,txt}']
      }
    }),
    staticOAuthCallback(),
  ]
})
