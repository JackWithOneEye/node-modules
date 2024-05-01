import { BYTES_PER_UNIT, MAX_CHANNEL_COUNT, RENDER_QUANTUM_FRAMES } from './constants';

export class HeapAudioBuffer {

    /** @type {number} */
    #bufferFrameLength;

    /** @type {number} */
    #channelCount;

    /** @type {Float32Array[]} */
    #data;

    /** @type {number} */
    #dataPtr;

    /** @type {number} */
    #maxChannelCount;

    /** @type {Float32Array} */
    #memory;

    /**
     * 
     * @param {number} dataPtr 
     * @param {number} channelCount 
     * @param {Float32Array} memory 
     * @param {number} [bufferFrameLength = RENDER_QUANTUM_FRAMES] 
     * @param {number} [maxChannelCount] 
     */
    constructor(
        dataPtr,
        channelCount,
        memory,
        bufferFrameLength = RENDER_QUANTUM_FRAMES,
        maxChannelCount
    ) {
        this.#bufferFrameLength = bufferFrameLength;
        this.#channelCount = channelCount
        this.#maxChannelCount = maxChannelCount
            ? Math.min(maxChannelCount, MAX_CHANNEL_COUNT) : this.#channelCount;
        this.#memory = memory;
        this.#dataPtr = dataPtr;
        this.#data = [];
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
        return this.#data.some(d => d.byteLength === 0);
    }

    #allocateHeap() {
        const channelSizeBytes = this.#bufferFrameLength * Float32Array.BYTES_PER_ELEMENT;
        for (let i = 0; i < this.#channelCount; i++) {
            const channelStartPtr = this.#dataPtr + i * channelSizeBytes;
            const channelEndPtr = channelStartPtr + channelSizeBytes;
            this.#data[i] = this.#memory.subarray(
                channelStartPtr >> BYTES_PER_UNIT,
                channelEndPtr >> BYTES_PER_UNIT
            );
        }
    }


}