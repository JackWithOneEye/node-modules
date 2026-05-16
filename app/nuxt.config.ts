import { definePreset } from '@primeuix/themes'
import Aura from '@primeuix/themes/aura'

const AppPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{cyan.50}',
      100: '{cyan.100}',
      200: '{cyan.200}',
      300: '{cyan.300}',
      400: '{cyan.400}',
      500: '{cyan.500}',
      600: '{cyan.600}',
      700: '{cyan.700}',
      800: '{cyan.800}',
      900: '{cyan.900}',
      950: '{cyan.950}',
    },
  },
})

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@primevue/nuxt-module',
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

  eslint: {
    config: {
      stylistic: true,
    },
  },

  primevue: {
    options: {
      theme: {
        preset: AppPreset,
        options: {
          darkModeSelector: '.dark',
          cssLayer: {
            name: 'primevue',
            order: 'tailwind-base, primevue, tailwind-utilities',
          },
        },
      },
    },
  },

  // primevue: {
  //   importPT: { as: 'Tailwind', from: 'primevue/passthrough/tailwind' },
  // },
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    editorSupport: {
      autocompleteUtil: { as: 'tw' },
    },
    config: {
      darkMode: 'class',
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
