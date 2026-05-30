// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@pinia/nuxt',
    '@nuxt/ui',
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

  app: {
    head: {
      htmlAttrs: { class: 'dark' },
    },
  },

  css: [
    '~/assets/css/tailwind.css',
  ],
  compatibilityDate: '2026-05-20',
  vite: {
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        '@vue-flow/core',
        '@vue-flow/controls',
        '@vue-flow/background',
        '@vue-flow/minimap',
        'pts',
        'webmidi',
        '@vue-flow/node-toolbar',
      ],
    },

  },
  eslint: {
    config: {
      stylistic: true,
    },
  },
})
