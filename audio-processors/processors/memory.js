import { initSync } from '../pkg/audio_processors';
import wasmBinary from '../pkg/audio_processors_bg.wasm';

class CachedWasmF32Memory {
    /** @type {Float32Array} */
    #cache;

    /** @type {WebAssembly.Memory} */
    #memory;

    /**
     * @param {WebAssembly.Memory} memory 
     */
    constructor(memory) {
        this.#memory = memory
        this.#cache = new Float32Array(this.#memory.buffer);
    }

    get() {
        if (this.#cache.byteLength === 0) {
            this.#cache = new Float32Array(this.#memory.buffer);
        }
        return this.#cache;
    }
}

const io = initSync(wasmBinary);

// const bar = {
//     value: new Float32Array(io.memory.buffer)
// }

// const foo = new Proxy(bar, {
//     get(target, prop, reciever) {
//         if (prop !== 'value') {
//             return;
//         }
//         if (target[prop].byteLength === 0) {
//             target[prop] = new Float32Array(io.memory.buffer)
//         }
//         return target[prop]
//     }
// })

export const cachedF32Memory = new CachedWasmF32Memory(io.memory);