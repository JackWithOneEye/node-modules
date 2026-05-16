# Agent Instructions

## Build/Test Commands
- **App (Nuxt 4)**: `cd app && bun run dev` (dev, loads `../.env`), `bun run build` (prod)
- **Audio Processors**: `cd audio-processors && bun run build` (Go builder → wasm-pack + esbuild), `bun run build:watch` (watch)
- **Postinstall** (audio-processors): compiles `build/cmd/main.go` → `./builder` binary — run once after clone
- **WASM only**: `cd audio-processors/wasm && wasm-pack build --target=web --out-dir ../pkg`
- **Lint**: `cd app && bun eslint .` (ESLint via @nuxt/eslint with stylistic rules)
- **No test framework** configured anywhere

## Architecture
- **app/**: Nuxt 4 Vue frontend — node-based modular audio editor using @vue-flow
- **audio-processors/**: Rust WASM audio DSP (`wasm/src/`) + JS AudioWorklet wrappers (`processors/`), custom Go builder (`build/cmd/main.go`)
- **app/server/api/**: Nuxt server routes — patch persistence (`patches/index.get/post.ts`, `patches/[id].get/post.ts`) and AudioWorklet script serving (`audio-processors-script.get.ts`)
- **app/stores/**: Pinia stores (audio-context, data, midi, waveshapers)
- **app/app/composables/**: 13 composables (add-module, editor-history, editor-clipboard, editor-actions, DnD, handle-signals, params, etc.)
- **27 module components** in `app/app/components/modules/*.client.vue`, all client-only
- **Data persistence**: JSON files at `$DATA_STORE_DIRECTORY` (default: `~/.node-modules/`), loaded/saved via Nuxt server API
- **AudioWorklet loading**: `audioContext.audioWorklet.addModule('/api/audio-processors-script')` — served from the bundled output file
- **Dependencies**: Vue Flow (node editor), Pinia (state), PrimeVue + Tailwind (UI), WebMIDI
- **Rust**: wasm-bindgen, rustfft, pitch-detection, rand; no_std-friendly; `wasm_utils` proc-macro crate

## Code Style
- **TypeScript**: Strict types, `defineProps<Type>()` with `withDefaults()` when needed
- **Vue**: Composition API, PascalCase components, `.client.vue` for client-only
- **Imports**: Named imports; Nuxt auto-imports composables/utils
- **Naming**: camelCase functions/vars, PascalCase components, kebab-case files
- **Error handling**: Try-catch with `console.warn()` for non-critical errors
- **Rust**: rustfmt conventions, `wasm-bindgen` for JS interop

## Repo-Specific Gotchas
- **Monorepo, not a workspace**: No root `package.json` — each subdirectory is independent with its own lockfile
- **Go builder required**: Audio-processors build needs Go installed. The `build.mjs` file is a Bun-based fallback, NOT the default builder
- **.env** (`DATA_STORE_DIRECTORY`, `AUDIO_PROCESSORS_OUTPUT_FILE`) must exist for both app dev and audio-processors build
- **Dark mode by default**: `htmlAttrs: { class: 'dark' }` in nuxt.config
- **Signal system**: Port colors encode signal type (audio=white, cv=cyan, gate=yellow, midi=purple) — enforced in `utils/signal.ts` and `composables/useHandleSignals.ts`
- **History snapshot depth**: `MAX_HISTORY = 10` in `useEditorHistory` — param tweaks are NOT tracked, only structural changes
