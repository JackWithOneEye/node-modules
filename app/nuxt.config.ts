// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    'nuxt-primevue',
  ],

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  imports: {
    presets: [
      {
        from: '@vue-flow/core',
        imports: [
          'Position',
          'useHandleConnections',
          'useNode',
          'useNodesInitialized',
          'useVueFlow',
        ],
      },
    ],
  },
  devtools: { enabled: true },

  compatibilityDate: '2024-11-23',

  eslint: {
    config: {
      stylistic: true,
    },
  },

  // primevue: {
  //   importPT: { as: 'Tailwind', from: 'primevue/passthrough/tailwind' },
  // },
  tailwindcss: {
    editorSupport: {
      autocompleteUtil: { as: 'tw' },
    },
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
})
