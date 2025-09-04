import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  return {
    plugins: [
      react(),
      // Only enable PWA in production builds to avoid SW interference in dev
      isProd && VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
        devOptions: { enabled: false },
        manifest: {
          name: 'LinkedIn Analytics',
          short_name: 'LI Analytics',
          description: 'Private-first LinkedIn analytics (local PWA)',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          icons: [
            { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml' }
          ]
        },
        workbox: {
          navigateFallbackDenylist: [/^\/api\//],
        },
      })
    ].filter(Boolean),
  }
})
