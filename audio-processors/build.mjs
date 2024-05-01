import { $ } from 'bun'
import * as esbuild from 'esbuild'

const esbuildOptions = {
    entryPoints: ['index.js'],
    bundle: true,
    platform: 'browser',
    loader: {
        '.wasm': 'binary'
    },
    outfile: process.env.AUDIO_PROCESSORS_BUILD_FILE,
    format: 'esm'
}

const wasmPackCmd = 'wasm-pack build --target=web --out-dir ../pkg'

if (process.argv[2] === '--watch') {
    const ctx = await esbuild.context(esbuildOptions)
    await ctx.watch()
    console.log('esbuild watching...')
    
    await $`cargo watch -C ./wasm/src -s "${wasmPackCmd}"`
} else {
    // jesus christ, this actually works
    await $`${{ raw: wasmPackCmd }}`.cwd('./wasm')
    await esbuild.build(esbuildOptions)
}



