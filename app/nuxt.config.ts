// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
  imports: {
    presets: [
      {
        from: '@vue-flow/background',
        imports: [
          'Background',
        ],
      },
      {
        from: '@vue-flow/controls',
        imports: [
          'Controls',
        ],
      },
      {
        from: '@vue-flow/core',
        imports: [
          'Handle',
          'Position',
          'useNodesInitialized',
          'useVueFlow',
          'VueFlow',
        ],
      },
    ],
  },
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
  tailwindcss: {
    config: {
      theme: {
        extend: {
          fontSize: {
            handle: ['0.5rem', '0.5rem'],
          },
        },
      },
    },
  },
  // primevue: {
  //   importPT: { as: 'Tailwind', from: 'primevue/passthrough/tailwind' },
  // },
})
