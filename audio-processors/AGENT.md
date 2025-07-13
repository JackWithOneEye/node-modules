# Agent Instructions

## Build/Test Commands
- **Build**: `bun run build` (compiles Rust WASM + bundles JS with custom Go builder)
- **Watch mode**: `bun run build:watch` (watches both Rust and JS changes)
- **Install**: `bun install` followed by postinstall Go builder compilation
- **Test**: No test framework configured - tests would need to be added
- **WASM only**: `cd wasm && wasm-pack build --target=web --out-dir ../pkg`

## Architecture
- **Hybrid Rust/JS project**: Rust WASM modules for audio processing, JS AudioWorklet wrappers
- **processors/**: JS AudioWorkletProcessor classes importing WASM bindings from `../pkg/`
- **wasm/src/**: Rust crate with audio processing algorithms (ADSR, filters, oscillators, etc.)
- **Custom build system**: Go builder (`./builder`) orchestrates wasm-pack + esbuild bundling
- **Memory management**: Shared heap buffers between JS/WASM with `HeapAudioBuffer` abstraction

## Code Style
- **JS**: ES6 modules, camelCase, private fields with `#`, JSDoc types for parameters
- **Rust**: Standard rustfmt conventions, `wasm-bindgen` for JS interop
- **Classes**: AudioWorkletProcessor pattern with parameter descriptors and memory management
- **Imports**: Named imports, relative paths for local modules
- **Error handling**: Memory detached events, graceful processor destruction
- **Files**: kebab-case for processors, helpers/ for shared utilities
