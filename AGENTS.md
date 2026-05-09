# Agent Instructions

## Build/Test Commands
- **App (Nuxt)**: `cd app && bun run dev` (dev), `cd app && bun run build` (prod)
- **Audio Processors**: `cd audio-processors && bun run build` (Rust→WASM), `bun run build:watch` (watch)
- **WASM only**: `cd audio-processors/wasm && wasm-pack build --target=web --out-dir ../pkg`
- **Lint**: `cd app && bun eslint .` (ESLint via @nuxt/eslint with stylistic rules)
- **No test framework** configured yet

## Architecture
- **app/**: Nuxt 3 Vue frontend - node-based audio editor using @vue-flow
- **audio-processors/**: Rust WASM audio DSP + JS AudioWorklet wrappers, Go-based builder
- **app/server/api/**: Nuxt server API routes
- **app/stores/**: Pinia state management | **app/composables/**: Vue composables
- **Dependencies**: Vue Flow, WebMIDI, Pinia, PrimeVue + Tailwind

## Code Style
- **TypeScript**: Strict types, `defineProps<Type>()` with `withDefaults()` when needed
- **Vue**: Composition API, PascalCase components, `.client.vue` for client-only
- **Imports**: Named imports; Nuxt auto-imports composables/utils
- **Naming**: camelCase functions/vars, PascalCase components, kebab-case files
- **Error handling**: Try-catch with `console.warn()` for non-critical errors
- **Rust**: rustfmt conventions, `wasm-bindgen` for JS interop
