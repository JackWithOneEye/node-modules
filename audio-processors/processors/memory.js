import { initSync } from '../pkg/audio_processors';
import wasmBinary from '../pkg/audio_processors_bg.wasm';

const MEMORY_DETACHED_EVENT = 'memoryDetached';

class CachedWasmF32Memory extends EventTarget {
    /** @type {Float32Array} */
    #cache;

    /** @type {WebAssembly.Memory} */
    #memory;

    /** @type {WeakMap<AudioWorkletProcessor, EventListenerOrEventListenerObject>} */
    #listeners = new WeakMap()

    /**
     * @param {WebAssembly.Memory} memory 
     */
    constructor(memory) {
        super();
        this.#memory = memory
        this.#cache = new Float32Array(this.#memory.buffer);
    }

    get() {
        if (this.#cache.byteLength === 0) {
            this.#cache = new Float32Array(this.#memory.buffer);
            this.dispatchEvent(new Event(MEMORY_DETACHED_EVENT))
        }
        return this.#cache;
    }

    /**
     * 
     * @param {AudioWorkletProcessor} registrant 
     * @param {EventListenerOrEventListenerObject} listener 
     */
    registerListener(registrant, listener) {
        this.addEventListener(MEMORY_DETACHED_EVENT, listener);
        this.#listeners.set(registrant, listener);
    }

    /**
     * 
     * @param {AudioWorkletProcessor} registrant 
     */
    unregisterListener(registrant) {
        const listener = this.#listeners.get(registrant);
        if (listener) {
            this.removeEventListener(MEMORY_DETACHED_EVENT, listener);
        }
    }
}

const io = initSync(wasmBinary);

export const cachedF32Memory = new CachedWasmF32Memory(io.memory);