export default defineNuxtConfig({
  compatibilityDate: '2025-05-19',
  ssr: false,
  modules: ['@nuxtjs/tailwindcss', '@pinia/nuxt', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  nitro: {
    prerender: {
      routes: ['/'],
      failOnError: false,
    },
  },
  app: {
    head: {
      title: '鬼島台灣模擬器：社畜篇',
      meta: [
        { name: 'description', content: '一款台灣黑色幽默人生模擬遊戲' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'theme-color', content: '#0a0a0a' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: '鬼島模擬器' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { property: 'og:title', content: '鬼島台灣模擬器：社畜篇' },
        { property: 'og:description', content: '一款台灣黑色幽默人生模擬遊戲。每天一張事件卡，你能撐過 30 天嗎？' },
        { property: 'og:type', content: 'website' },
        { property: 'og:image', content: '/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: '/og-image.png' },
      ],
      link: [
        { rel: 'manifest', href: '/manifest.webmanifest' },
        { rel: 'icon', type: 'image/svg+xml', href: '/pwa-icon-source.svg' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon-180x180.png' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Noto+Sans+TC:wght@400;700&display=swap',
        },
      ],
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: '鬼島台灣模擬器：社畜篇',
      short_name: '鬼島模擬器',
      description: '一款台灣黑色幽默人生模擬遊戲',
      theme_color: '#0a0a0a',
      background_color: '#0a0a0a',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      lang: 'zh-Hant',
      categories: ['games', 'entertainment'],
      icons: [
        { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,ico,wav,json,woff2,woff}'],
      globIgnores: ['**/audio/bgm.mp3'],
      navigateFallback: '/',
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: /\/audio\/.*\.(mp3|wav|ogg)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'audio-cache',
            expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            rangeRequests: true,
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-stylesheets',
            expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
          },
        },
      ],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
    },
  },
})
