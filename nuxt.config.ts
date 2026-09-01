// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    '~/assets/css/global.css',
  ],
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/jpeg', href: '/icons/banamex_logo.jpeg' },
      ],
    },
  },
})
