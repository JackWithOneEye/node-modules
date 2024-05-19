import { cachedF32Memory } from '../memory';
import { BYTES_PER_UNIT, MAX_CHANNEL_COUNT, RENDER_QUANTUM_FRAMES } from './constants';

export class HeapAudioBuffer {

    /** @type {number} */
    #bufferFrameLength;

    /** @type {number} */
    #channelCount;

    /** @type {Float32Array[]} */
    #data = [];

    /** @type {number} */
    #dataPtr;

    /** @type {number} */
    #maxChannelCount;

    /**
     * 
     * @param {number} dataPtr 
     * @param {number} channelCount 
     * @param {number} [bufferFrameLength = RENDER_QUANTUM_FRAMES] 
     * @param {number} [maxChannelCount] 
     */
    constructor(
        dataPtr,
        channelCount,
        bufferFrameLength = RENDER_QUANTUM_FRAMES,
        maxChannelCount
    ) {
        this.#bufferFrameLength = bufferFrameLength;
        this.#channelCount = channelCount
        this.#maxChannelCount = maxChannelCount
            ? Math.min(maxChannelCount, MAX_CHANNEL_COUNT) : this.#channelCount;
        this.#dataPtr = dataPtr;
        this.#allocateHeap();
    }

    get frameLength() {
        return this.#bufferFrameLength;
    }

    free() {
        this.#data.length = 0;
    }

    getData() {
        return this.#data;
    }

    getHeapAddress() {
        return this.#dataPtr;
    }

    /**
     * @param {number} channelIndex 
     */
    getChannelData(channelIndex) {
        return this.#data[channelIndex];
    }

    /**
     * 
     * @param {Float32Array} buffer 
     * @param {number} channelIndex 
     * @returns 
     */
    setChannelData(buffer, channelIndex) {
        if (!buffer) {
            return;
        }
        this.#data[channelIndex].set(buffer);
    }

    isMemoryDetached() {
        for (const d of this.#data) {
            if (d.byteLength === 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * 
     * @param {number} dataPtr 
     */
    recoverMemory(dataPtr) {
        this.free();
        this.#dataPtr = dataPtr;
        this.#allocateHeap();
    }

    #allocateHeap() {
        const memory = cachedF32Memory.get();
        const channelSizeBytes = this.#bufferFrameLength * Float32Array.BYTES_PER_ELEMENT;
        for (let i = 0; i < this.#channelCount; i++) {
            const channelStartPtr = this.#dataPtr + i * channelSizeBytes;
            const channelEndPtr = channelStartPtr + channelSizeBytes;
            this.#data[i] = memory.subarray(
                channelStartPtr >> BYTES_PER_UNIT,
                channelEndPtr >> BYTES_PER_UNIT
            );
        }
    }
}
