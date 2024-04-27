// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'nuxt-primevue',
  ],
  eslint: {
    config: {
      stylistic: true,
    },
  },
  primevue: {
    importPT: { as: 'Tailwind', from: 'primevue/passthrough/tailwind' },
  },
})
