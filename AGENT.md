# Agent Instructions

## Build/Test Commands
- **App (Nuxt)**: `cd app && bun run dev` (development), `bun run build` (production)
- **Audio Processors (Rust/WASM)**: `cd audio-processors && bun run build` (compile Rust to WASM), `bun run build:watch` (watch mode)
- **Lint**: Use ESLint via Nuxt (`@nuxt/eslint` with stylistic rules enabled)
- **No test framework** configured - tests would need to be added

## Architecture
- **app/**: Nuxt 3 Vue frontend with modular audio editor using @vue-flow
- **audio-processors/**: Rust WASM modules for audio processing, built with custom Go builder
- **app/server/api/**: Nuxt server API routes
- **Key dependencies**: Vue Flow for node editor, WebMIDI, Pinia for state, PrimeVue + Tailwind for UI

## Code Style
- **TypeScript**: Strict types, `defineProps<Type>()` with optional `withDefaults()`
- **Vue**: Composition API, PascalCase components, kebab-case attributes
- **Imports**: Named imports, auto-imports for composables via Nuxt
- **Naming**: camelCase variables/functions, PascalCase components
- **Error handling**: Try-catch with `console.warn()` for non-critical errors
- **Files**: `.client.vue` suffix for client-only components

## Development Workflow
Use `cd app && bun run dev` to start development server. Audio processors require separate build step when modified.
