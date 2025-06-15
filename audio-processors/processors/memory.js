import { initSync } from '../pkg/audio_processors';
import wasmBinary from '../pkg/audio_processors_bg.wasm';

export const MEMORY_DETACHED_EVENT = 'memoryDetached';

class CachedWasmF32Memory extends EventTarget {
  /** @type {Float32Array} */
  #cache;

  /** @type {WebAssembly.Memory} */
  #memory;

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
   * @param {EventListenerOrEventListenerObject} listener 
   */
  registerListener(listener) {
    this.addEventListener(MEMORY_DETACHED_EVENT, listener);
  }

  /**
   * @param {EventListenerOrEventListenerObject} listener 
   */
  unregisterListener(listener) {
    this.removeEventListener(MEMORY_DETACHED_EVENT, listener);
  }
}

const io = initSync({ module: wasmBinary });

export const cachedF32Memory = new CachedWasmF32Memory(io.memory);
