import { cachedF32Memory } from '../memory';
import { BYTES_PER_UNIT, RENDER_QUANTUM_FRAMES } from './constants';

export class HeapParameterBuffer {
    /** @type {number} */
    #bufferFrameLength;

    /** @type {Float32Array} */
    #data;

    /** @type {number} */
    #dataPtr;

    /**
     * @param {number} dataPtr 
     * @param {number} [bufferFrameLength = RENDER_QUANTUM_FRAMES] 
     */
    constructor(
        dataPtr,
        bufferFrameLength = RENDER_QUANTUM_FRAMES,
    ) {
        this.#bufferFrameLength = bufferFrameLength;
        this.#dataPtr = dataPtr;
        this.#data = this.#allocateHeap();
    }

    /**
     * @param {Float32Array} buffer 
     */
    setData(buffer) {
        if (!buffer) {
            return;
        }
        if (buffer.length === 1) {
            this.#data.fill(buffer[0]);
            return;
        }
        this.#data.set(buffer);
    }

    isMemoryDetached() {
        return this.#data.byteLength === 0;
    }

    /**
     * @param {number} dataPtr 
     */
    recoverMemory(dataPtr) {
        this.#dataPtr = dataPtr;
        this.#data = this.#allocateHeap();
    }

    #allocateHeap() {
        const memory = cachedF32Memory.get();
        const bufferSizeBytes = this.#bufferFrameLength * Float32Array.BYTES_PER_ELEMENT;
        return memory.subarray(
            this.#dataPtr >> BYTES_PER_UNIT,
            this.#dataPtr + bufferSizeBytes >> BYTES_PER_UNIT
        );
    }
}